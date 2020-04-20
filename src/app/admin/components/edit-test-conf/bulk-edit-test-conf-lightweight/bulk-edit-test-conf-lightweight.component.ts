import {
  AfterViewInit,
  Component,
  DoCheck,
  EventEmitter,
  Input,
  IterableDiffer,
  IterableDiffers,
  OnInit,
  Output
} from '@angular/core';
import { TestEdit } from "../edit-test-conf.component";
import { GeogebraObject } from "../../../../components/geogebra/custom-objects/geogebra-object";
import { HtmlUtils } from "../../../../utils/html-utils";
import { DocxParser } from "../../../../utils/docx-parser";
import { error } from "util";
import { NumberUtils } from "../../../../utils/NumberUtils";

export interface PagedTest {
  test: TestEdit
  originalIndex: number
}

export interface PageWithTests {
  id: number
  startIndex: number
  endIndex: number
  tests: PagedTest[]
}

@Component({
  selector: 'bulk-edit-test-conf-lightweight',
  templateUrl: './bulk-edit-test-conf-lightweight.component.html',
  styleUrls: ['./bulk-edit-test-conf-lightweight.component.css']
})
export class BulkEditTestConfLightweightComponent implements OnInit, DoCheck, AfterViewInit {

  @Input() groupId: number;
  @Input() tests: TestEdit[];
  @Input() isSaving: boolean;

  @Output() onSaved = new EventEmitter<TestEdit[]>();

  pageSize = 10;

  currentPage: PageWithTests;
  pages: number[];

  private iterableDiffer: IterableDiffer;

  constructor(iterableDiffers: IterableDiffers) {
    this.iterableDiffer = iterableDiffers.find([]).create(undefined);
  }

  ngOnInit() {
    this.recalculatePages()
  }

  ngAfterViewInit(): void {
  }

  ngDoCheck() {
    let changes = this.iterableDiffer.diff(this.tests);
    if (changes) {
      this.recalculatePages(1)
    }
  }

  deleteTest(index: number) {
    this.tests.splice(index, 1);
    this.recalculatePages(this.currentPage.id)
  }

  addTest(index: number) {
    const newTest = new TestEdit();
    newTest.id = NumberUtils.getRandomInt(-9900000, -50);
    newTest.groupId = this.groupId;
    if (index === 0) {
      this.tests.unshift(newTest)
    } else {
      this.tests.splice(index, 0, newTest);
    }
    this.recalculatePages(this.currentPage.id)
  }

  save() {
    this.onSaved.emit(this.tests);
  }

  recalculatePages(selectedPage?: number) {
    const testCount = this.tests.length;
    const pageCount = Math.ceil(testCount / this.pageSize);
    this.pages = [];
    for(let i = 1; i <= pageCount; i++) {
      this.pages.push(i)
    }
    const pageToLoad = (selectedPage && selectedPage > 0 && selectedPage <= pageCount) ? selectedPage : 1;
    const startIndex = pageToLoad === 1 ? 0 : pageToLoad * this.pageSize - this.pageSize;
    const projectedEndIndex = startIndex + this.pageSize;
    const endIndex = projectedEndIndex > testCount ? testCount : projectedEndIndex;
    const currentPageTests = this.tests.slice(startIndex, endIndex)
    this.currentPage = {
      id: pageToLoad,
      startIndex: startIndex,
      endIndex: endIndex,
      tests: currentPageTests.map((t, index) => ({
        originalIndex: startIndex + index,
        test: t
      }))
    }
  }

  trackTest(index, test: PagedTest) {
    return test ? test.test.id : undefined;
  }

}