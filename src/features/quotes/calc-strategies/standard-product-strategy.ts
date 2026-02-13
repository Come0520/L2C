import { BaseCalcStrategy } from './base-strategy';

export class StandardProductStrategy extends BaseCalcStrategy {
    calculate(params: any): any {
        console.log('Mock StandardProductStrategy.calculate');
        return { amount: 0 };
    }
}
