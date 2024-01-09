import {Context, Document, IdGenerator, Layout, Processor, Segment} from "@localizeio/lib";
import {visitParents} from "unist-util-visit-parents";
import {SegmentsMap} from "./types";

function convertJsonToMap(jsonObj: any, parentKey: string = ''): Record<string, any> {
    let result: Record<string, any> = {};

    for (const [key, value] of Object.entries(jsonObj)) {
        const newKey = parentKey ? `${parentKey}.${key}` : key;

        if (typeof value === 'object' && value !== null) {
            Object.assign(result, convertJsonToMap(value as any, newKey));
        } else if (Array.isArray(value)) {
            value.forEach((item, index) => {
                const arrayKey = `${newKey}..${index}`;
                if (typeof item === 'object' && item !== null) {
                    Object.assign(result, convertJsonToMap(item as any, arrayKey));
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

function convertMapToJson(rows: {key: string, value: string}[]) {
    const result = {};

    rows.forEach(row => {
        const {key, value} = row
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
        const lastValue: string = value;

        if (Number.isInteger(Number(lastKey))) {
            currentObj.push({ [lastValue.split(':')[0].trim()]: lastValue.split(':')[1].trim() });
        } else {
            currentObj[lastKey] = lastValue;
        }
    });

    return result;
}

class JsonProcessor implements Processor {
    private context: Context;

    constructor(context: Context) {
        this.context = context;
    }

    parse(res: string): Document {
        const idGenerator: IdGenerator = new IdGenerator(this.context);
        const segments: Segment[] = []
        const resJson = JSON.parse(res)
        const resMap = convertJsonToMap(resJson)
        const resKeys = Object.keys(resMap)

        const element: any = resKeys.map((key) => {
            const value = resMap[key].toString()
            const id: string = idGenerator.generateId(value, {})
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
                        properties: {},
                        children: [
                            {
                                "type": "segment",
                                "id": id
                            }
                        ]
                    }
                ]
            }
        })

        const layout: Layout = {
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
        }

        return {segments, layout}
    }

    stringify(data: Document): string {
        const segmentsMap: SegmentsMap = {};

        data.segments.forEach((segment: Segment): void => {
            segmentsMap[segment.id] = segment;
        });

        const rows: {key: string, value: string}[] = []

        visitParents(data.layout, { tagName: "tr" }, (row: any) => {
            const key = row.children[0].children[0].value
            const value = segmentsMap[row.children[1].children[0].id].text

            rows.push({key, value})

        })

        return JSON.stringify(convertMapToJson(rows))
    }
}

export default JsonProcessor;
