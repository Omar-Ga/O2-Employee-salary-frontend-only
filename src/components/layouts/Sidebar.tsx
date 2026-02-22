import { Box, HStack, Heading, Icon, Stack, Text, Link as ChakraLink } from "@chakra-ui/react"
import { LuLayoutDashboard, LuUsers, LuWallet, LuSettings } from "react-icons/lu"
import { useTranslation } from "react-i18next"
import { useLocation, Link } from "react-router-dom"

const MENU_ITEMS = [
  { key: "dashboard", icon: LuLayoutDashboard, path: "/" },
  { key: "employees", icon: LuUsers, path: "/employees" },
  { key: "payroll", icon: LuWallet, path: "/payroll" },
  { key: "settings", icon: LuSettings, path: "/settings" },
]

export const Sidebar = () => {
  const { t } = useTranslation('sidebar')
  const location = useLocation()

  return (
    <Box w="280px" h="100vh" bg="white" borderEndWidth="1px" borderColor="gray.50" pos="fixed" top="0" insetStart="0" py="8" px="6" shadow="none" zIndex="sticky">
      <HStack mb="16" gap="2" align="baseline">
        <Heading size="lg" fontFamily="heading" letterSpacing="tight" fontWeight="bold">{t('app.name')}</Heading>
        <Box w="1.5" h="1.5" borderRadius="full" bg="oxygen.500" alignSelf="center" />
        <Heading size="lg" fontFamily="heading" letterSpacing="tight" fontWeight="normal" color="gray.400">{t('app.subtitle')}</Heading>
      </HStack>

      <Text fontSize="xs" fontWeight="bold" color="gray.400" mb="6" letterSpacing="widest" textTransform="uppercase">{t('section.main')}</Text>

      <Stack gap="1">
        {MENU_ITEMS.map((item) => {
          const isActive = item.path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(item.path)

          return (
            <ChakraLink asChild key={item.key} _hover={{ textDecor: 'none' }} w="full" display="block">
              <Link to={item.path}>
                <HStack
                  w="full"
                  py="3"
                  px="4"
                  borderRadius="lg"
                  bg={isActive ? "oxygen.50" : "transparent"}
                  color={isActive ? "oxygen.600" : "gray.500"}
                  transition="all 0.2s"
                  _hover={{
                    bg: isActive ? "oxygen.50" : "gray.50",
                    color: "oxygen.600"
                  }}
                  position="relative"
                >
                  <Icon as={item.icon} boxSize="5" strokeWidth={isActive ? 2.5 : 2} />
                  <Text fontWeight={isActive ? "bold" : "medium"}>{t(`items.${item.key}`)}</Text>

                  {isActive && (
                    <Box
                      position="absolute"
                      left="0"
                      top="50%"
                      transform="translateY(-50%)"
                      h="16px"
                      w="3px"
                      bg="oxygen.500"
                      borderRadius="0 4px 4px 0"
                    />
                  )}
                </HStack>
              </Link>
            </ChakraLink>
          )
        })}
      </Stack>
    </Box>
  )
}
