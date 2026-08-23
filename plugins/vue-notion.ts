import VueNotion, {getPageBlocks, getPageTable} from "vue-notion";

// The vue-notion proxy (api.vue-notion.workers.dev) started returning Notion
// records double-nested ("{<id>: {spaceId, value: {value: <record>}}}") while
// NotionRenderer expects the classic shape ("{<id>: {role, value: <record>}}").
// With the new shape every block lookup resolves to undefined and pages using
// $notion silently render empty (e.g. /interne/channels).
//
// This wrapper restores the classic shape and makes sure the requested page is
// the first record of the map, which is how NotionRenderer picks its root block
// when no explicit contentId is passed.

const dashedId = (id: string) =>
    id.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-$3-$4-$5");

const normalizePageBlocks = (blockMap: Record<string, any>, pageId: string) => {
    if (!blockMap || typeof blockMap !== "object") return blockMap;

    const normalized: Record<string, any> = {};
    let changed = false;
    for (const [key, entry] of Object.entries(blockMap)) {
        const inner = (entry as any)?.value;
        if (
            entry && typeof entry === "object" &&
            inner && typeof inner === "object" &&
            !("type" in inner) && inner.value && typeof inner.value === "object"
        ) {
            changed = true;
            normalized[key] = {role: (entry as any).role ?? "reader", value: inner.value};
        } else {
            normalized[key] = entry;
        }
    }

    // Guarantee the requested page is the root (first key) of the map.
    const rootKey = dashedId(pageId);
    if (!(Object.keys(normalized)[0] === rootKey) && normalized[rootKey]) {
        const reordered: Record<string, any> = {[rootKey]: normalized[rootKey]};
        for (const [key, entry] of Object.entries(normalized)) {
            if (key !== rootKey) reordered[key] = entry;
        }
        return reordered;
    }

    return changed ? normalized : blockMap;
};

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(VueNotion);

    return {
        provide: {
            notion: {
                getPageBlocks: async (pageId: string | string[], endpoint?: string) => {
                    const id = Array.isArray(pageId) ? pageId[0] : pageId;
                    return normalizePageBlocks(await getPageBlocks(id, endpoint), id);
                },
                getPageTable,
            },
        },
    };
});
