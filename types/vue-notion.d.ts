// vue-notion ships no type declarations.
declare module "vue-notion" {
    export const NotionRenderer: any;
    export const getPageBlocks: (
        pageId?: string,
        endpoint?: string
    ) => Promise<Record<string, any>>;
    export const getPageTable: (
        pageId?: string,
        endpoint?: string
    ) => Promise<any>;

    const VueNotion: any;
    export default VueNotion;
}
