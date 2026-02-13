import { 
  Box, 
  Heading, 
  Text, 
  Table, 
  Badge, 
  HStack, 
  Stack, 
  Button, 
  IconButton,
  Alert,
} from "@chakra-ui/react"
import { LuTrash2, LuPencil, LuShieldAlert } from "react-icons/lu"
import { useTranslation } from "react-i18next"

const MOCK_USERS = [
  {
    id: 1,
    name: "Alex Morgan",
    email: "alex.morgan@o2mation.com",
    role: "admin",
    status: "active",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
  },
  {
    id: 2,
    name: "Sarah Chen",
    email: "sarah.chen@o2mation.com",
    role: "editor",
    status: "active",
    avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
  },
  {
    id: 3,
    name: "James Wilson",
    email: "james.wilson@o2mation.com",
    role: "viewer",
    status: "inactive",
    avatar: "https://i.pravatar.cc/150?u=a04258114e29026302d",
  },
  {
    id: 4,
    name: "Emily Davis",
    email: "emily.davis@o2mation.com",
    role: "viewer",
    status: "active",
    avatar: "https://i.pravatar.cc/150?u=a04258114e29026702d",
  },
  {
    id: 5,
    name: "Michael Brown",
    email: "michael.brown@o2mation.com",
    role: "editor",
    status: "active",
    avatar: "https://i.pravatar.cc/150?u=a04258114e29026708d",
  },
]

export const UsersTab = () => {
  const { t } = useTranslation('users')

  return (
    <Box position="relative">
      <Stack gap={6}>
        {/* Header Section */}
        <Box>
          <Heading size="md" mb={2}>{t('title')}</Heading>
          <Text color="gray.500" fontSize="sm">
            {t('subtitle')}
          </Text>
        </Box>

        {/* Restriction Warning */}
        <Alert.Root status="error" variant="subtle" borderRadius="lg">
          <Alert.Indicator>
            <LuShieldAlert />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title>{t('alert.title')}</Alert.Title>
            <Alert.Description>
              {t('alert.description')}
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>

        {/* Restricted Content Area */}
        <Box 
          opacity={0.5} 
          pointerEvents="none" 
          filter="blur(0.5px)"
          userSelect="none"
          aria-hidden="true"
        >
          {/* Action Bar (Disabled) */}
          <HStack justify="space-between" mb={4}>
            <Text fontSize="sm" fontWeight="medium" color="gray.600">
              {t('count', { count: MOCK_USERS.length })}
            </Text>
            <Button disabled size="sm" colorPalette="oxygen">
              {t('invite')}
            </Button>
          </HStack>

          {/* Users Table */}
          <Table.Root size="md" variant="outline" striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader width="300px">{t('table.user')}</Table.ColumnHeader>
                <Table.ColumnHeader>{t('table.role')}</Table.ColumnHeader>
                <Table.ColumnHeader>{t('table.status')}</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">{t('table.actions')}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {MOCK_USERS.map((user) => (
                <Table.Row key={user.id}>
                  <Table.Cell>
                    <HStack gap={3}>
                      <Box>
                        <Text fontWeight="medium" fontSize="sm">{user.name}</Text>
                        <Text color="gray.500" fontSize="xs">{user.email}</Text>
                      </Box>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="subtle" colorPalette={user.role === "admin" ? "purple" : user.role === "editor" ? "blue" : "gray"}>
                      {t(`roles.${user.role}`)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="solid" colorPalette={user.status === "active" ? "green" : "red"} size="sm">
                      {t(`status.${user.status}`)}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell textAlign="end">
                    <HStack justify="end" gap={2}>
                      <IconButton disabled aria-label={t('actions.edit')} variant="ghost" size="xs">
                        <LuPencil />
                      </IconButton>
                      <IconButton disabled aria-label={t('actions.delete')} variant="ghost" size="xs" colorPalette="red">
                        <LuTrash2 />
                      </IconButton>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      </Stack>
    </Box>
  )
}
