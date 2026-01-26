import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  DocumentEntity,
  DocumentEntityDocument,
  DocumentVisibility,
} from './schemas/document.schema';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { ClassEntity, ClassDocument } from '../classes/schemas/class.schema';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectModel(DocumentEntity.name)
    private readonly documentModel: Model<DocumentEntityDocument>,
    @InjectModel(ClassEntity.name)
    private readonly classModel: Model<ClassDocument>,
  ) {}

  /**
   * Giáo viên tạo tài liệu mới
   * Mặc định visibility = class và gắn classIds của lớp do giáo viên phụ trách
   */
  async create(
    user: UserDocument,
    dto: CreateDocumentDto & { originalFileName?: string },
  ) {
    // Nếu không truyền classIds, tự động lấy tất cả lớp của giáo viên
    let classIds = dto.classIds?.map((id) => new Types.ObjectId(id)) || [];

    if (classIds.length === 0) {
      // Lấy tất cả lớp mà giáo viên này phụ trách
      const teacherClasses = await this.classModel
        .find({ teacherId: user._id })
        .select('_id')
        .exec();
      classIds = teacherClasses.map((c) => c._id as Types.ObjectId);
    }

    const document = new this.documentModel({
      title: dto.title,
      description: dto.description,
      fileUrl: dto.fileUrl,
      originalFileName: dto.originalFileName,
      ownerTeacherId: user._id,
      classIds,
      visibility: dto.visibility || DocumentVisibility.Class,
      branchId: dto.branchId ? new Types.ObjectId(dto.branchId) : undefined,
    });

    await document.save();

    return this.findOne(document._id.toString());
  }

  /**
   * Lấy tài liệu của giáo viên (owner)
   */
  async findByTeacher(teacherId: string) {
    return this.documentModel
      .find({ ownerTeacherId: new Types.ObjectId(teacherId) })
      .populate('ownerTeacherId', 'name email')
      .populate('classIds', 'name subject')
      .populate('branchId', 'name')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Lấy tài liệu cho học sinh xem
   * Chỉ trả tài liệu visibility = community
   * HOẶC tài liệu visibility = class mà học sinh có trong classIds
   */
  async findForStudent(studentId: string) {
    // Lấy danh sách lớp mà học sinh đang học
    const studentClasses = await this.classModel
      .find({ studentIds: new Types.ObjectId(studentId) })
      .select('_id')
      .exec();

    const studentClassIds = studentClasses.map((c) => c._id);

    // Query: visibility = community OR (visibility = class AND classIds overlap with studentClassIds)
    return this.documentModel
      .find({
        $or: [
          { visibility: DocumentVisibility.Community },
          {
            visibility: DocumentVisibility.Class,
            classIds: { $in: studentClassIds },
          },
        ],
      })
      .populate('ownerTeacherId', 'name email')
      .populate('classIds', 'name subject')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Lấy tất cả tài liệu cộng đồng (public)
   */
  async findCommunity() {
    return this.documentModel
      .find({ visibility: DocumentVisibility.Community })
      .populate('ownerTeacherId', 'name email')
      .populate('classIds', 'name subject')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Lấy tài liệu theo lớp (cho giáo viên/admin)
   */
  async findByClass(classId: string) {
    return this.documentModel
      .find({ classIds: new Types.ObjectId(classId) })
      .populate('ownerTeacherId', 'name email')
      .populate('classIds', 'name subject')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Lấy chi tiết tài liệu
   */
  async findOne(id: string) {
    const document = await this.documentModel
      .findById(id)
      .populate('ownerTeacherId', 'name email')
      .populate('classIds', 'name subject')
      .populate('branchId', 'name')
      .exec();

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  /**
   * Cập nhật tài liệu (chỉ owner hoặc admin)
   */
  async update(id: string, dto: UpdateDocumentDto, user: UserDocument) {
    const document = await this.documentModel.findById(id).exec();

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Chỉ owner hoặc admin mới được cập nhật
    if (
      document.ownerTeacherId.toString() !== user._id.toString() &&
      user.role !== 'admin'
    ) {
      throw new ForbiddenException('Bạn không có quyền cập nhật tài liệu này');
    }

    const updateData: any = { ...dto };

    if (dto.classIds) {
      updateData.classIds = dto.classIds.map((id) => new Types.ObjectId(id));
    }

    if (dto.branchId) {
      updateData.branchId = new Types.ObjectId(dto.branchId);
    }

    const updated = await this.documentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('ownerTeacherId', 'name email')
      .populate('classIds', 'name subject')
      .populate('branchId', 'name')
      .exec();

    return updated;
  }

  /**
   * Chuyển visibility sang community (chia sẻ cộng đồng)
   */
  async shareToCommuity(id: string, user: UserDocument) {
    return this.update(id, { visibility: DocumentVisibility.Community }, user);
  }

  /**
   * Chuyển visibility sang class (giới hạn lớp)
   */
  async restrictToClass(id: string, user: UserDocument) {
    return this.update(id, { visibility: DocumentVisibility.Class }, user);
  }

  /**
   * Tăng số lượt tải
   */
  async incrementDownload(id: string) {
    return this.documentModel
      .findByIdAndUpdate(id, { $inc: { downloadCount: 1 } }, { new: true })
      .exec();
  }

  /**
   * Xóa tài liệu (chỉ owner hoặc admin)
   */
  async remove(id: string, user: UserDocument) {
    const document = await this.documentModel.findById(id).exec();

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Chỉ owner hoặc admin mới được xóa
    if (
      document.ownerTeacherId.toString() !== user._id.toString() &&
      user.role !== 'admin'
    ) {
      throw new ForbiddenException('Bạn không có quyền xóa tài liệu này');
    }

    await this.documentModel.findByIdAndDelete(id).exec();

    return { message: 'Document deleted successfully', id };
  }
}
