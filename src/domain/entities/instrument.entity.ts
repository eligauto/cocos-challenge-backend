import { InstrumentType } from '../value-objects/instrument-type.enum';

export class Instrument {
  constructor(
    public readonly id: number,
    public readonly ticker: string,
    public readonly name: string,
    public readonly type: InstrumentType,
  ) {}

  isCurrency(): boolean {
    return this.type === InstrumentType.MONEDA;
  }

  isStock(): boolean {
    return this.type === InstrumentType.ACCIONES;
  }
}
