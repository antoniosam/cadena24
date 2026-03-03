import { PrivilegeLevel } from '../enums/privilege-level.enum';

export class Privilege {
  readonly code: string;
  readonly name: string;
  readonly level: PrivilegeLevel;

  constructor(code: string, name: string, level: PrivilegeLevel) {
    this.code = code;
    this.name = name;
    this.level = level;
  }
}
