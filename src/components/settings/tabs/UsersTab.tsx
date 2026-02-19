import {
  Box,
  Heading,
  Text,
  Table,
  Badge,
  HStack,
  Stack,
  Button,
  Flex,
  Skeleton,
} from "@chakra-ui/react"
import { Avatar } from "@/components/ui/avatar"
import { MenuRoot, MenuTrigger, MenuContent, MenuItem } from "@/components/ui/menu"
import { LuPlus, LuEllipsis, LuPencil, LuTrash2 } from "react-icons/lu"
import { useTranslation } from "react-i18next"
import { useQuery } from "@tanstack/react-query"
import { userService } from "@/services/user.service"

export const UsersTab = () => {
  const { t } = useTranslation(['users', 'translation'])

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['settings_users'],
    queryFn: userService.getAll,
  })

  // Derive roles map for translations if available, fallback to identity
  const getRoleLabel = (role: string) => role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User'

  return (
    <Box position="relative" animation="fade-in 0.4s ease-out">
      <Stack gap={8}>
        {/* Header Section */}
        <Flex justify="space-between" align="flex-end" wrap="wrap" gap={4}>
          <Box>
            <Heading size="lg" mb={2} letterSpacing="tight" fontWeight="bold">
              {t('title')}
            </Heading>
            <Text color="gray.500" fontSize="sm">
              {t('subtitle')}
            </Text>
          </Box>
          <Button size="sm" colorPalette="oxygen" gap={2} borderRadius="md" fontWeight="bold">
            <LuPlus />
            {t('invite')}
          </Button>
        </Flex>

        {/* Users Table */}
        <Box
          borderRadius="2xl"
          border="1px solid"
          borderColor="gray.200"
          background="white"
          overflow="hidden"
          shadow="sm"
        >
          <Table.Root size="md" variant="line">
            <Table.Header bg="gray.50">
              <Table.Row>
                <Table.ColumnHeader color="gray.500" fontWeight="medium" textTransform="uppercase" fontSize="xs" letterSpacing="wider" width="350px">
                  {t('table.user')}
                </Table.ColumnHeader>
                <Table.ColumnHeader color="gray.500" fontWeight="medium" textTransform="uppercase" fontSize="xs" letterSpacing="wider">
                  {t('table.role')}
                </Table.ColumnHeader>
                <Table.ColumnHeader color="gray.500" fontWeight="medium" textTransform="uppercase" fontSize="xs" letterSpacing="wider">
                  {t('table.status')}
                </Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end" color="gray.500" fontWeight="medium" textTransform="uppercase" fontSize="xs" letterSpacing="wider">
                  {t('table.actions')}
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {isLoading && Array.from({ length: 3 }).map((_, idx) => (
                <Table.Row key={idx}>
                  <Table.Cell><Skeleton height="40px" width="200px" /></Table.Cell>
                  <Table.Cell><Skeleton height="24px" width="80px" /></Table.Cell>
                  <Table.Cell><Skeleton height="24px" width="60px" /></Table.Cell>
                  <Table.Cell><Skeleton height="32px" width="32px" ml="auto" /></Table.Cell>
                </Table.Row>
              ))}

              {!isLoading && users.map((user) => (
                <Table.Row key={user.id} _hover={{ bg: "gray.50/50" }} transition="background 0.2s">
                  <Table.Cell>
                    <HStack gap={4}>
                      <Avatar
                        src={user.avatar ? `${import.meta.env.VITE_POCKETBASE_URL}/api/files/users/${user.id}/${user.avatar}` : undefined}
                        name={user.name}
                        size="md"
                        colorPalette="oxygen"
                      />
                      <Box>
                        <Text fontWeight="semibold" fontSize="sm" color="gray.900" letterSpacing="tight">{user.name || t('unnamed')}</Text>
                        <Text color="gray.500" fontSize="xs">{user.email}</Text>
                      </Box>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant="subtle"
                      colorPalette={user.role === "admin" ? "purple" : user.role === "editor" ? "blue" : "gray"}
                      borderRadius="full"
                      px={3}
                      py={1}
                      fontWeight="bold"
                    >
                      {getRoleLabel(user.role)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      variant="solid"
                      colorPalette={user.verified ? "green" : "orange"}
                      size="sm"
                      borderRadius="full"
                      px={3}
                      py={1}
                      fontWeight="bold"
                      bg={user.verified ? "green.500" : "orange.400"}
                    >
                      {user.verified ? t('status.verified') : t('status.pending')}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell textAlign="end">
                    <MenuRoot>
                      <MenuTrigger asChild>
                        <Button variant="ghost" size="sm" color="gray.400" _hover={{ color: "gray.800", bg: "gray.100" }}>
                          <LuEllipsis />
                        </Button>
                      </MenuTrigger>
                      <MenuContent>
                        <MenuItem value="edit" gap={2}>
                          <LuPencil /> {t('actions.edit')}
                        </MenuItem>
                        <MenuItem value="delete" color="red.500" _hover={{ bg: "red.50" }} gap={2}>
                          <LuTrash2 /> {t('actions.delete')}
                        </MenuItem>
                      </MenuContent>
                    </MenuRoot>
                  </Table.Cell>
                </Table.Row>
              ))}

              {!isLoading && users.length === 0 && (
                <Table.Row>
                  <Table.Cell colSpan={4} textAlign="center" py={12}>
                    <Text color="gray.500">{t('noUsersFound')}</Text>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      </Stack>
    </Box>
  )
}
