import { GeogebraObjectJson, GeogebraObjectSettings, GGOKindType } from "../geogebra-object";
import { Angle, CoordsUtils, XYCoords } from "../../../../utils/geometryUtils";
import { GGB } from "../../geogebra-definitions";
import { PolygonGGO, PolygonGGOJSON, PolygonSettingsJson } from "./polygon-ggo";
import { PointGGO, PointGGOJSON } from "../point-ggo";
import XY = CoordsUtils.XY;
import { SizeGGO, SizeGGODirection } from "../size-ggo";
import LabelMode = GGB.LabelMode;

export interface PlateGGOJSON extends PolygonGGOJSON {
  b: number
  h: number
  settings?: PolygonSettingsJson
}

export interface PlateGGOSizeDirections {
  b: "up" | "down"
  h: "right" | "left"
}

/**
 * B            C1
 *  -----------
 *  |          |
 *  |    .C    | h
 *  |          |
 *  |_________ |
 * Root  b      D
 */
export class PlateGGO extends PolygonGGO {
  kind: GGOKindType = "plate";

  private rootPoint: PointGGO;
  private bPoint: PointGGO;
  private c1Point: PointGGO;
  private dPoint: PointGGO;

  constructor(
    public id: number,
    public name: string,
    public root: XYCoords,
    public b: number,
    public h: number,
    settings?: PolygonSettingsJson,
    sizeDirections?: PlateGGOSizeDirections
  ) {
    super(id, name, root, settings);
    this.generatePoints(id, root, b, h, this.settings);
    this.generateSizes(id, root, b, h, sizeDirections)
  }

  private generatePoints(id: number, root: XYCoords, b: number, h: number, settings: PolygonSettingsJson) {
    const withId = this.withId;

    const Root = root.copy();
    const B = XY(Root.x, Root.y + h);
    const C1 = XY(Root.x + b, Root.y + h);
    const D = XY(Root.x + b, Root.y);

    this.rootPoint = new PointGGO(withId("Root"), root, this.outerPointSettings());
    this.bPoint = new PointGGO(withId("B"), B);
    this.c1Point = new PointGGO(withId("C1"), C1);
    this.dPoint = new PointGGO(withId("D"), D);

    this.centerPoint = this.makeCenterPoint(XY(Root.x + b/2, Root.y + h/2));

    this.points = [this.rootPoint, this.bPoint, this.c1Point, this.dPoint]
  }

  private generateSizes(id: number, root: XYCoords, b: number, h: number, sizeDirections?: PlateGGOSizeDirections) {
    const withId = this.withId;
    if (this.settings.showSizes) {
      const sizeDirs: PlateGGOSizeDirections = {
        b: sizeDirections && sizeDirections.b || "up",
        h: sizeDirections && sizeDirections.h || "right",
      };
      const shapeSize = Math.max(b, h);
      const sizeB = sizeDirs.b == "up"
        ? new SizeGGO(withId("SizeB"), this.bPoint.root.copy(), this.c1Point.root.copy(), sizeDirs.b, "" + b, shapeSize)
        : new SizeGGO(withId("SizeB"), this.rootPoint.root.copy(), this.dPoint.root.copy(), sizeDirs.b, "" + b, shapeSize);

      const sizeH = sizeDirs.h == "right"
        ? new SizeGGO(withId("SizeH"), this.dPoint.root.copy(), this.c1Point.root.copy(), sizeDirs.h,"" + h, shapeSize)
        : new SizeGGO(withId("SizeH"), this.rootPoint.root.copy(), this.bPoint.root.copy(), sizeDirs.h,"" + h, shapeSize);

      this.sizes = [sizeB, sizeH]
    }
  }

  copy(): PlateGGO {
    return new PlateGGO(this.id, this.name, this.root.copy(), this.b, this.h, this.actualJsonSettings)
  }

  toJson(): PlateGGOJSON {
    return Object.assign(super.toJson(), {
      b: this.b,
      h: this.h
    })
  }

  static fromJson(json: GeogebraObjectJson): PlateGGO {
    const j = json as PlateGGOJSON;
    return new PlateGGO(j.id, j.name, XYCoords.fromJson(j.root), j.b, j.h, j.settings)
  }
}
