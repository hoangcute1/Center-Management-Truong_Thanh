import { Injectable } from '@nestjs/common';
import { PaymentGateway } from './payment.gateway';
import { FakeGateway } from './fake.gateway';
import { PayosGateway } from './payos.gateway';
import { PaymentMethod } from '../schemas/payment.schema';

@Injectable()
export class PaymentGatewayFactory {
  // FakeGateway doesn't have dependencies so we can instantiate it directly or inject it
  private fakeGateway = new FakeGateway();

  constructor(private readonly payosGateway: PayosGateway) {}

  getByMethod(method: string): PaymentGateway | null {
    console.log(`PaymentGatewayFactory.getByMethod input: '${method}'`);
    
    switch (method) {
      case PaymentMethod.FAKE:
        console.log('Selected FakeGateway');
        return this.fakeGateway;
      case PaymentMethod.PAYOS:
        console.log('Selected PayosGateway');
        return this.payosGateway;
      // CASH doesn't use a gateway url generation in the traditional sense, handled by service directly
      case PaymentMethod.CASH:
        console.log('Selected CASH (null gateway)');
        return null;
      default:
        console.log(`Method '${method}' not handled by factory, returning null`);
        return null;
    }
  }
}
