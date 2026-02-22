import { DepartmentsResponse } from "@/types/pocketbase-types"
import { DepartmentNode } from "./types"

export function flatRecordsToTree(records: DepartmentsResponse[]): DepartmentNode[] {
    const nodeMap = new Map<string, DepartmentNode>()
    const rootNodes: DepartmentNode[] = []

    // 1. First pass: Create all nodes map
    for (const record of records) {
        nodeMap.set(record.id, {
            id: record.id,
            name: record.name,
            type: record.type,
            children: []
        })
    }

    // 2. Second pass: Link children to parents
    for (const record of records) {
        const node = nodeMap.get(record.id)
        if (!node) continue

        if (record.parentId) {
            const parentNode = nodeMap.get(record.parentId)
            if (parentNode) {
                parentNode.children = parentNode.children || []
                parentNode.children.push(node)
            } else {
                // Parent no longer exists (e.g., deleted), treat as root to prevent orphaned nodes
                rootNodes.push(node)
            }
        } else {
            rootNodes.push(node)
        }
    }

    return rootNodes
}
