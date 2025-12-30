import { Injectable, BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { ClassesService } from '../classes/classes.service';
import { BranchesService } from '../branches/branches.service';
import { UserRole } from '../common/enums/role.enum';
import { UserStatus } from '../common/enums/user-status.enum';
import {
  ImportUsersDto,
  ImportResult,
  ImportResponse,
  StudentRowData,
  TeacherRowData,
  ParentRowData,
} from './dto/import-users.dto';

// Mật khẩu mặc định cho tài khoản mới
export const DEFAULT_PASSWORD = '123456789';

@Injectable()
export class ImportsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly classesService: ClassesService,
    private readonly branchesService: BranchesService,
  ) {}

  // Trả về mật khẩu mặc định
  private generateTempPassword(): string {
    return DEFAULT_PASSWORD;
  }

  // Đọc file Excel/CSV và trả về array of objects
  parseFile(buffer: Buffer, mimetype: string): Record<string, any>[] {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      return data as Record<string, any>[];
    } catch (error) {
      throw new BadRequestException(
        'Không thể đọc file. Vui lòng kiểm tra định dạng file.',
      );
    }
  }

  // Chuẩn hóa tên cột (loại bỏ dấu, lowercase)
  private normalizeColumnName(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]/g, '');
  }

  // Map column names từ tiếng Việt sang English
  private mapColumns(row: Record<string, any>): Record<string, any> {
    const mapping: Record<string, string> = {
      hoten: 'name',
      ten: 'name',
      hovaten: 'name',
      email: 'email',
      sodienthoai: 'phone',
      dienthoai: 'phone',
      sdt: 'phone',
      ngaysinh: 'dateOfBirth',
      namsinh: 'dateOfBirth',
      monday: 'subject',
      mon: 'subject',
      gioitinh: 'gender',
      tenphuhuynh: 'parentName',
      sdtphuhuynh: 'parentPhone',
      emailcon: 'childEmail',
      emailhocsinh: 'childEmail',
      coso: 'branch',
      chinhanh: 'branch',
    };

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(row)) {
      const normalizedKey = this.normalizeColumnName(key);
      const mappedKey = mapping[normalizedKey] || normalizedKey;
      result[mappedKey] = value;
    }
    return result;
  }

  // Validate email
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate row data
  private validateRow(
    row: Record<string, any>,
    rowIndex: number,
  ): { valid: boolean; error?: string } {
    if (!row.name || String(row.name).trim() === '') {
      return { valid: false, error: `Dòng ${rowIndex}: Thiếu họ tên` };
    }
    if (!row.email || String(row.email).trim() === '') {
      return { valid: false, error: `Dòng ${rowIndex}: Thiếu email` };
    }
    if (!this.isValidEmail(String(row.email).trim())) {
      return {
        valid: false,
        error: `Dòng ${rowIndex}: Email không hợp lệ (${row.email})`,
      };
    }
    return { valid: true };
  }

  // Import users từ file
  async importUsers(
    buffer: Buffer,
    mimetype: string,
    dto: ImportUsersDto,
  ): Promise<ImportResponse> {
    const rawData = this.parseFile(buffer, mimetype);

    if (rawData.length === 0) {
      throw new BadRequestException('File không có dữ liệu');
    }

    const results: ImportResult[] = [];
    let successful = 0;
    let failed = 0;
    const createdUserIds: string[] = []; // Lưu ID các user được tạo thành công

    for (let i = 0; i < rawData.length; i++) {
      const rowIndex = i + 2; // +2 vì row 1 là header, index bắt đầu từ 0
      const rawRow = rawData[i];
      const row = this.mapColumns(rawRow);

      // Validate
      const validation = this.validateRow(row, rowIndex);
      if (!validation.valid) {
        results.push({
          success: false,
          row: rowIndex,
          email: row.email,
          name: row.name,
          error: validation.error,
        });
        failed++;
        continue;
      }

      // Generate temp password
      const tempPassword = this.generateTempPassword();

      try {
        // Map giới tính
        let gender: 'male' | 'female' | 'other' | undefined;
        if (row.gender) {
          const genderStr = String(row.gender).toLowerCase().trim();
          if (genderStr === 'nam' || genderStr === 'male') {
            gender = 'male';
          } else if (
            genderStr === 'nữ' ||
            genderStr === 'nu' ||
            genderStr === 'female'
          ) {
            gender = 'female';
          } else {
            gender = 'other';
          }
        }

        // Tạo user với mustChangePassword = true
        const createData: any = {
          name: String(row.name).trim(),
          email: String(row.email).trim().toLowerCase(),
          phone: row.phone ? String(row.phone).trim() : undefined,
          password: tempPassword,
          role: dto.role,
          branchId: dto.branchId,
          dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
          gender,
          status: UserStatus.Active,
          mustChangePassword: true,
        };

        // Thêm thông tin phụ huynh cho học sinh
        if (dto.role === UserRole.Student) {
          if (row.parentName)
            createData.parentName = String(row.parentName).trim();
          if (row.parentPhone)
            createData.parentPhone = String(row.parentPhone).trim();
        }

        // Thêm email con cho phụ huynh
        if (dto.role === UserRole.Parent && row.childEmail) {
          createData.childEmail = String(row.childEmail).trim().toLowerCase();
        }

        const newUser = await this.usersService.create(createData);

        // Lưu ID để thêm vào lớp sau
        createdUserIds.push((newUser as any)._id.toString());

        results.push({
          success: true,
          row: rowIndex,
          email: String(row.email).trim().toLowerCase(),
          name: String(row.name).trim(),
          tempPassword,
        });
        successful++;
      } catch (error: any) {
        const errorMessage = error.message || 'Lỗi không xác định';
        results.push({
          success: false,
          row: rowIndex,
          email: String(row.email).trim(),
          name: String(row.name).trim(),
          error: errorMessage.includes('already exists')
            ? `Email đã tồn tại: ${row.email}`
            : errorMessage,
        });
        failed++;
      }
    }

    // Nếu có classId và role là student, thêm học sinh vào lớp
    if (
      dto.classId &&
      dto.role === UserRole.Student &&
      createdUserIds.length > 0
    ) {
      try {
        await this.classesService.addStudentsToClass(
          dto.classId,
          createdUserIds,
        );
      } catch (error: any) {
        console.error('Error adding students to class:', error);
        // Không throw error vì user đã được tạo thành công
      }
    }

    return {
      total: rawData.length,
      successful,
      failed,
      results,
      classId: dto.classId, // Trả về classId để frontend biết
    };
  }

  // Tạo file template Excel
  async generateTemplate(role: UserRole, branchId?: string): Promise<Buffer> {
    // Lấy danh sách cơ sở để thêm vào dropdown
    const branches = await this.branchesService.findAll();
    const branchNames = branches.map((b) => b.name).join(', ');

    let headers: string[];
    let sampleData: any[];

    switch (role) {
      case UserRole.Student:
        headers = [
          'Họ tên',
          'Email',
          'Số điện thoại',
          'Ngày sinh',
          'Giới tính',
          'Tên phụ huynh',
          'SĐT phụ huynh',
          'Cơ sở',
        ];
        sampleData = [
          {
            'Họ tên': 'Nguyễn Văn A',
            Email: 'nguyenvana@email.com',
            'Số điện thoại': '0123456789',
            'Ngày sinh': '2010-01-15',
            'Giới tính': 'Nam',
            'Tên phụ huynh': 'Nguyễn Văn Cha',
            'SĐT phụ huynh': '0912345678',
            'Cơ sở': branches[0]?.name || 'Cơ sở 1',
          },
          {
            'Họ tên': 'Trần Thị B',
            Email: 'tranthib@email.com',
            'Số điện thoại': '0987654321',
            'Ngày sinh': '2011-05-20',
            'Giới tính': 'Nữ',
            'Tên phụ huynh': 'Trần Văn Mẹ',
            'SĐT phụ huynh': '0987654321',
            'Cơ sở': branches[0]?.name || 'Cơ sở 1',
          },
        ];
        // Thêm ghi chú về các cơ sở có sẵn
        if (branches.length > 0) {
          sampleData.push({
            'Họ tên': `[GHI CHÚ: Cơ sở có sẵn: ${branchNames}]`,
            Email: '',
            'Số điện thoại': '',
            'Ngày sinh': '',
            'Giới tính': '[Nam/Nữ]',
            'Tên phụ huynh': '',
            'SĐT phụ huynh': '',
            'Cơ sở': '',
          });
        }
        break;

      case UserRole.Teacher:
        headers = [
          'Họ tên',
          'Email',
          'Số điện thoại',
          'Ngày sinh',
          'Giới tính',
          'Môn dạy',
        ];
        sampleData = [
          {
            'Họ tên': 'Cô Nguyễn Thị C',
            Email: 'nguyenthic@email.com',
            'Số điện thoại': '0111222333',
            'Ngày sinh': '1990-03-10',
            'Giới tính': 'Nữ',
            'Môn dạy': 'Toán',
          },
          {
            'Họ tên': 'Thầy Trần Văn D',
            Email: 'tranvand@email.com',
            'Số điện thoại': '0444555666',
            'Ngày sinh': '1985-08-25',
            'Giới tính': 'Nam',
            'Môn dạy': 'Anh Văn',
          },
        ];
        break;

      case UserRole.Parent:
        headers = ['Họ tên', 'Email', 'Số điện thoại', 'Email con (học sinh)'];
        sampleData = [
          {
            'Họ tên': 'Phụ huynh A',
            Email: 'phuhuynha@email.com',
            'Số điện thoại': '0777888999',
            'Email con (học sinh)': 'nguyenvana@email.com',
          },
          {
            'Họ tên': 'Phụ huynh B',
            Email: 'phuhuynhb@email.com',
            'Số điện thoại': '0999000111',
            'Email con (học sinh)': 'tranthib@email.com',
          },
        ];
        break;

      default:
        headers = ['Họ tên', 'Email', 'Số điện thoại', 'Ngày sinh'];
        sampleData = [
          {
            'Họ tên': 'Người dùng A',
            Email: 'usera@email.com',
            'Số điện thoại': '0123456789',
            'Ngày sinh': '2000-01-01',
          },
        ];
    }

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

    // Set column widths
    worksheet['!cols'] = headers.map(() => ({ wch: 25 }));

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
