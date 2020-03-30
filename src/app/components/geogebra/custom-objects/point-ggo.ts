import { GGB } from "../geogebra-definitions";
import { GeogebraObject, GeogebraObjectJson, GeogebraObjectSettings, GGOKindType } from "./geogebra-object";
import { Angle, XYCoords, XYCoordsJson } from "../../../utils/geometryUtils";
import { GeogebraObjectUtils } from "./geogebra-object-utils";
import LabelMode = GGB.LabelMode;
import { StringUtils } from "../../../utils/StringUtils";
import { GeometryShapeJson, GeometryShapeType } from "./geometry-shape";

export interface PointGGOJSON extends GeogebraObjectJson {
  settings?: GeogebraObjectSettings
}

export class PointGGO implements GeogebraObject {
  kind: GGOKindType = "point";
  settings: GeogebraObjectSettings;

  readonly shapeId: string;

  private isInverted: boolean = false;

  constructor(public name: string,
              public root: XYCoords,
              settings?: GeogebraObjectSettings,
              public id: number = GeogebraObjectUtils.nextId()) {
    this.settings = GeogebraObjectUtils.settingsWithDefaults(settings);
    this.settings.isVisible = settings && settings.isVisible || false;
    this.shapeId = `Point${StringUtils.keepLettersAndNumbersOnly(this.name)}${this.id}`;
  }

  rotate(angle: Angle, point?: XYCoordsJson): PointGGO {
    this.root.rotate(angle, point || new XYCoords(0, 0));
    return this
  }

  invert(): PointGGO {
    this.root.invert();
    this.isInverted = !this.isInverted;
    return this
  }

  copy(): PointGGO {
    return new PointGGO(this.name, this.root.copy(), this.settings);
  }

  getCommands(): string[] {
    const pointCmd = `${this.shapeId}=${this.root.getCommand()}`;
    let labelMode = this.settings.labelMode;
    let caption = this.settings.caption;
    if (this.isInverted) {
      switch (labelMode) {
        case GGB.LabelMode.Value:
          labelMode = GGB.LabelMode.Caption;
          caption = this.root.copy().invert().getCommand();
          break;
        case GGB.LabelMode.NameValue:
          labelMode = GGB.LabelMode.Caption;
          caption = `${this.name}${this.root.copy().invert().getCommand()}`;
          break;
        case GGB.LabelMode.CaptionValue:
          labelMode = GGB.LabelMode.Caption;
          caption = `${caption}${this.root.copy().invert().getCommand()}`;
          break;
        default:
        //leave caption and label mode as is
      }
    }
    return [
      pointCmd,
      ...(this.settings.labelMode !== GGB.LabelMode.Name ? [`SetLabelMode(${this.shapeId},${labelMode})`] : []),
      ...(!this.settings.isVisible ? [`SetVisibleInView(${this.shapeId},1,false)`] : []),
      ...(this.settings.isVisible ? [`SetPointSize(${this.shapeId},${this.settings.pointSize})`] : []),
      ...(this.settings.isVisible ? [`ShowLabel(${this.shapeId},${this.settings.isLabelVisible})`] : []),
      ...(this.settings.isVisible && labelMode === LabelMode.Caption && this.settings.isLabelVisible ? [`SetCaption(${this.shapeId},"${caption}")`] : []),
      ...(this.settings.isVisible && this.settings.styles.color ? [`SetColor(${this.shapeId},"${this.settings.styles.color}")`] : []),
      ...(this.settings.isFixed ? [`SetFixed(${this.shapeId},true)`] : [])
    ]
  }

  toJson(): GeometryShapeJson {
    throw new Error("toJson() on PointGGO is not supported.")
  }

  static fromJson(json: GeogebraObjectJson): PointGGO {
    const j = json as PointGGOJSON;
    return new PointGGO(j.name, XYCoords.fromJson(j.root), j.settings, j.id)
  }

  maxCoord(): XYCoordsJson {
    return this.root.copy()
  }

  minCoord(): XYCoordsJson {
    return this.root.copy()
  }

  getDeleteCommands(): string[] {
    return [`Delete(${this.shapeId})`]
  }

  getCenterCoords(): XYCoordsJson {
    return this.root.toJson()
  }

  getDimensions(): { width: number; height: number } {
    return {
      width: 0,
      height: 0
    }
  }
}