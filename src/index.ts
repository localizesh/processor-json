import {Context, Document, IdGenerator, LayoutRoot, Processor, Segment} from "@localizesh/sdk";
import {visitParents} from "unist-util-visit-parents";
import {SegmentsMap} from "./types";

class JsonProcessor implements Processor {
  parse(res: string, ctx?: Context): Document {
    const idGenerator: IdGenerator = new IdGenerator();
    const segments: Segment[] = [];
    const resJson = JSON.parse(res);
    const resMap = this._convertJsonToMap(resJson);
    const resKeys = Object.keys(resMap);

    const element: any = resKeys.map((key) => {

      let value = resMap[key];
      const isBool = typeof value === "boolean";
      const isNumber = this.isNumber(value);
      const isNull = value === null;
      value = (isNull) ? "" : value.toString();

      const id: string = idGenerator.generateId(value, {}, ctx);
      const segment: Segment = {
        id,
        text: value || "",
      };

      segments.push(segment);

      return {
        type: "element",
        tagName: "tr",
        properties: {},
        children: [
          {
            type: "element",
            tagName: "td",
            properties: {},
            children: [
              {
                type: "text",
                value: key
              }
            ]
          },
          {
            type: "element",
            tagName: "td",
            properties: isBool
              ? {isBool: true}
              : isNumber
                ? {isNumber: true}
                : isNull
                  ? {isNull: true}
                  : {},
            children: [
              {
                "type": "segment",
                "id": id
              }
            ]
          }
        ]
      };
    });

    const layout: LayoutRoot = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "table",
          children: [
            {
              type: "element",
              tagName: "tbody",
              properties: {},
              children: element
            }
          ],
          properties: {}
        }
      ]
    };

    return {segments, layout};
  }

  stringify(data: Document, ctx?: Context): string {
    const segmentsMap: SegmentsMap = {};

    data.segments.forEach((segment: Segment): void => {
      segmentsMap[segment.id] = segment;
    });

    const rows: { key: string, value: string | boolean | number | null }[] = [];

    visitParents(data.layout, {tagName: "tr"}, (row: any) => {
      const key = row.children[0].children[0].value
      const isBool = row.children[1]?.properties?.isBool;
      const isNumber = row.children[1]?.properties?.isNumber;
      const isNull = row.children[1]?.properties?.isNull;

      const item = segmentsMap[row.children[1].children[0].id].text;
      const value = isBool
        ? (item === "true")
        : isNumber
          ? Number(item)
          : isNull
            ? null
            : item;
      rows.push({key, value});
    });

    return JSON.stringify(this._convertMapToJson(rows), null, 2);
  }

  protected isNumber(value: any) {
    return typeof value === 'number' && !isNaN(value) && Number.isFinite(value);
  }

  protected _convertJsonToMap(jsonObj: any, parentKey: string = ''): Record<string, any> {
    let result: Record<string, any> = {};

    for (const [key, value] of Object.entries(jsonObj)) {
      const newKey = parentKey ? `${parentKey}.${key}` : key;

      if (typeof value === 'object' && value !== null) {
        Object.assign(result, this._convertJsonToMap(value as any, newKey));
      } else if (Array.isArray(value)) {
        value!.forEach((item, index) => {
          const arrayKey = `${newKey}..${index}`;
          if (typeof item === 'object' && item !== null) {
            Object.assign(result, this._convertJsonToMap(item as any, arrayKey));
          } else {
            result[arrayKey] = item;
          }
        });
      } else {
        result[newKey] = value;
      }
    }

    return result;
  }

  protected _convertMapToJson(rows: { key: string, value: string | boolean | number | null }[]) {
    const result = {};

    rows.forEach(row => {
      const {key, value} = row;
      const keys = key.split('.').map(str => str.trim());
      let currentObj: any = result;

      for (let i = 0; i < keys.length - 1; i++) {
        const currentKey = keys[i];

        if (!currentObj[currentKey]) {
          if (Number.isInteger(Number(keys[i + 1]))) {
            currentObj[currentKey] = [];
          } else {
            currentObj[currentKey] = {};
          }
        }

        currentObj = currentObj[currentKey];
      }

      const lastKey: string = keys[keys.length - 1];
      const lastValue: string | boolean | number | null = value;

      if (Number.isInteger(Number(lastKey)) && typeof lastValue === "string") {
        currentObj.push({[lastValue?.split(':')[0].trim()]: lastValue.split(':')[1].trim()});
      } else {
        currentObj[lastKey] = lastValue;
      }
    });

    return result;
  }
}

export default JsonProcessor;
