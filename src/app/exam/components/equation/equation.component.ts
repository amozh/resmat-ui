import { Component, Input, OnInit } from '@angular/core';
import { InputVariable, VarirableAnswer } from "../input-set/input-set.component";
import { MathSymbolConverter } from "../../../utils/MathSymbolConverter";

export const EquationItemValueType = {
  input: 'EquationItemValueInput',
  staticString: 'EquationItemValueStaticString',
  dynamicDouble: 'EquationItemValueDynamicDouble'
};

export interface ItemValueInput {
  id: number
  answerMapping: string
}

export interface ItemValueStr {
  value: string
}

export interface ItemValueDouble {
  answerMapping: string
  value: number
  precision: number
}

export type EquationItemValueDto = { [key:string]: ItemValueInput | ItemValueStr | ItemValueDouble }

export interface EquationItemDto {
  value: EquationItemValueDto
  prefix: string
  suffix: string
}

export interface EquationDto {
  id: number
  leftPart: EquationItemDto[]
  rightPart: EquationItemDto[]
}

/** --------------------------------- */

export interface EquationItemValue {
  type: string
  value: VarirableAnswer | string | ItemValueDouble
}

interface EquationItem {
  value: EquationItemValue
  prefix: string
  suffix: string
}

export interface Equation {
  id: number
  items: EquationItem[]
}

@Component({
  selector: 'equation',
  templateUrl: './equation.component.html',
  styleUrls: ['./equation.component.css']
})
export class EquationComponent implements OnInit {

  @Input() equation: Equation;
  @Input() showValidation: boolean = false;

  ValueType = EquationItemValueType;

  inputs: VarirableAnswer[];

  constructor() { }

  ngOnInit() {
    this.inputs = this.equation.items
      .filter(i => i.value.type === EquationItemValueType.input)
      .map(i => i.value.value) as VarirableAnswer[]
  }

  valueAsStr(itemValue: EquationItemValue): string {
    return itemValue.value as string
  }

  valueAsDouble(itemValue: EquationItemValue): ItemValueDouble {
    return itemValue.value as ItemValueDouble
  }
}