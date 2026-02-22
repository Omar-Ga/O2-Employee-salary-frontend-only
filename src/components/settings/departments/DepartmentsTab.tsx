import { useRef, useMemo, useState } from "react"
import { Box, Button, Heading, Text, Icon, Spinner } from "@chakra-ui/react"
import { LuFolderOpen, LuPlus } from "react-icons/lu"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Tree, TreeApi } from "react-arborist"

import { departmentService } from "@/services/department.service"
import { DepartmentsRecord, DepartmentsTypeOptions } from "@/types/pocketbase-types"
import { DepartmentNode } from "./types"
import { flatRecordsToTree } from "./utils"
import { DepartmentItem } from "./DepartmentItem"
import { toaster } from "@/components/ui/toaster"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

export const DepartmentsTab = () => {
  const { t } = useTranslation(['departments'])
  const queryClient = useQueryClient()
  const treeRef = useRef<TreeApi<DepartmentNode>>(null)

  const [deleteData, setDeleteData] = useState<{ id: string, hasChildren: boolean } | null>(null)
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null)

  const { data: rawDepartments, isLoading: isFetching } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentService.getAll
  })

  const treeData = useMemo(() => {
    if (!rawDepartments) return []
    return flatRecordsToTree(rawDepartments)
  }, [rawDepartments])

  // --- MUTATIONS ---
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['departments'] })

  const createMutation = useMutation({
    mutationFn: async ({ name, parentId, type }: { name: string, parentId?: string, type: string }) => {
      const payload: Partial<DepartmentsRecord> = { name, type: type as DepartmentsRecord['type'] }
      if (parentId) payload.parentId = parentId
      return await departmentService.create(payload)
    },
    onSuccess: invalidate,
    onError: (err: Error) => toaster.create({ title: t('errors.create') || "Error", description: err.message, type: "error" })
  })

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string, name: string }) => {
      return await departmentService.update(id, { name })
    },
    onSuccess: invalidate,
    onError: (err: Error) => toaster.create({ title: t('errors.update') || "Error", description: err.message, type: "error" })
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await departmentService.delete(id)
    },
    onSuccess: () => {
      invalidate()
    },
    onError: (err: Error) => toaster.create({ title: t('errors.delete') || "Error", description: err.message, type: "error" })
  })

  // --- TREE EVENTS ---

  const handleCreate = ({ parentId }: { parentId: string | null }) => {
    const parentType = parentId ? 'functional' : 'structural'
    createMutation.mutate({
      name: t('newItem'),
      ...(parentId ? { parentId } : {}),
      type: parentType
    })
    return null // react-arborist expects an object with id if sync, or null/Promise
  }

  const handleRename = ({ id, name }: { id: string, name: string }) => {
    renameMutation.mutate({ id, name })
  }

  const handleDeleteRequest = ({ ids }: { ids: string[] }) => {
    if (ids.length === 0) return
    const id = ids[0] // We only care about single operations
    const node = treeRef.current?.get(id)
    if (!node) return
    const hasChildren = node.children && node.children.length > 0

    if (hasChildren) {
      setDeleteData({ id, hasChildren: true })
    } else {
      deleteMutation.mutate(id)
    }
  }

  const confirmDeleteWithChildren = async () => {
    if (!deleteData) return

    // Deleting parent auto-deletes children in many DBs, but to be safe and explicit:
    // Actually, PocketBase cascading depends on schema setup. We will delete manually.
    const node = treeRef.current?.get(deleteData.id)
    if (node && node.children) {
      for (const child of node.children) {
        await departmentService.delete(child.id)
      }
    }

    deleteMutation.mutate(deleteData.id, {
      onSuccess: () => {
        if (deleteData.id === selectedDepartmentId) setSelectedDepartmentId(null)
        setDeleteData(null)
      }
    })
  }

  const confirmKeepChildren = async () => {
    if (!deleteData) return

    const node = treeRef.current?.get(deleteData.id)
    if (node && node.children) {
      for (const child of node.children) {
        // PocketBase handles removing a relation with a null value rather than an empty string
        await departmentService.update(child.id, { parentId: null as unknown as string, type: DepartmentsTypeOptions.structural })
      }
    }

    deleteMutation.mutate(deleteData.id, {
      onSuccess: () => {
        if (deleteData.id === selectedDepartmentId) setSelectedDepartmentId(null)
        setDeleteData(null)
      }
    })
  }


  return (
    <Box>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Heading size="md" color="gray.700">{t('title')}</Heading>
          <Text fontSize="sm" color="gray.500">{t('subtitle')}</Text>
        </Box>
        <Box display="flex" gap={2}>
          <Button size="xs" variant="outline" onClick={() => treeRef.current?.openAll()}>{t('actions.expandAll')}</Button>
          <Button size="xs" variant="outline" onClick={() => treeRef.current?.closeAll()}>{t('actions.collapseAll')}</Button>
          <Button
            size="sm"
            colorPalette="oxygen"
            variant="outline"
            loading={createMutation.isPending}
            onClick={() => handleCreate({ parentId: selectedDepartmentId })}
            disabled={!selectedDepartmentId}
          >
            <Icon as={LuPlus} mr={1} />
            {t('actions.addSubdepartment')}
          </Button>
          <Button
            size="sm"
            colorPalette="oxygen"
            loading={createMutation.isPending}
            onClick={() => handleCreate({ parentId: null })}
          >
            <Icon as={LuPlus} mr={1} />
            {t('actions.addDepartment')}
          </Button>
        </Box>
      </Box>

      <Box
        bg="gray.50"
        p={6}
        borderRadius="xl"
        minH="600px"
        border="1px dashed"
        borderColor="gray.300"
      >
        {isFetching ? (
          <Box h="full" display="flex" alignItems="center" justifyContent="center">
            <Spinner color="oxygen.500" />
          </Box>
        ) : treeData.length === 0 ? (
          <Box
            h="full"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="gray.400"
            flexDir="column"
            gap={2}
            mt={20}
            cursor="pointer"
            onClick={() => handleCreate({ parentId: null })}
          >
            <Icon as={LuFolderOpen} boxSize={10} color="gray.300" />
            <Text fontWeight="medium">{t('emptyState.title')}</Text>
            <Text fontSize="sm">{t('emptyState.subtitle')}</Text>
          </Box>
        ) : (
          <Box h="600px">
            <Tree
              ref={treeRef}
              data={treeData}
              width="100%"
              height={600}
              indent={24}
              rowHeight={50}
              padding={15}
              // Callbacks
              onCreate={handleCreate}
              onRename={handleRename}
              onDelete={handleDeleteRequest}
              onSelect={(nodes) => setSelectedDepartmentId(nodes.length > 0 ? nodes[0].id : null)}
            >
              {DepartmentItem}
            </Tree>
          </Box>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <DialogRoot open={!!deleteData} onOpenChange={(e) => { if (!e.open) setDeleteData(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteDialog.title')}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <DialogDescription>
              {t('deleteDialog.description')}
            </DialogDescription>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteData(null)}>
              {t('deleteDialog.cancel')}
            </Button>
            <Button colorPalette="blue" onClick={confirmKeepChildren} loading={deleteMutation.isPending}>
              {t('deleteDialog.keepChildren')}
            </Button>
            <Button colorPalette="red" onClick={confirmDeleteWithChildren} loading={deleteMutation.isPending}>
              {t('deleteDialog.deleteAll')}
            </Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </Box>
  )
}
