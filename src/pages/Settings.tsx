import { Box, Container, Heading, Text, Icon, Grid, GridItem, Card, Stack } from "@chakra-ui/react"
import { NavLink, Outlet } from "react-router-dom"
import { LuInfo, LuBuilding, LuFileOutput, LuFileInput, LuSettings } from "react-icons/lu"
import { useTranslation } from "react-i18next"
import { useMemo } from "react"

export const Settings = () => {
  const { t } = useTranslation(['settings', 'sidebar'])

  const tabGroups = useMemo(() => [
    {
      title: t('navigation.organization'),
      items: [
        { name: t('navigation.departments'), path: "departments", icon: LuBuilding },
      ]
    },
    {
      title: t('navigation.dataManagement'),
      items: [
        { name: t('navigation.export'), path: "export", icon: LuFileOutput },
        { name: t('navigation.import'), path: "import", icon: LuFileInput },
      ]
    },
    {
      title: t('navigation.system'),
      items: [
        { name: t('navigation.preferences'), path: "preferences", icon: LuSettings },
        { name: t('navigation.about'), path: "about", icon: LuInfo },
      ]
    }
  ], [t])

  return (
    <Box bg="gray.50" minH="calc(100vh - 64px)">
      <Container maxW="container.xl" py={{ base: 6, md: 10 }}>

        {/* Page Header */}
        <Box mb={10}>
          <Heading size="3xl" fontWeight="bold" letterSpacing="-0.03em" color="gray.900">
            {t('title')}
          </Heading>
          <Text color="gray.500" mt={3} fontSize="lg" maxW="2xl">
            {t('subtitle')}
          </Text>
        </Box>

        <Grid templateColumns={{ base: "1fr", lg: "280px 1fr" }} gap={{ base: 8, lg: 12 }} alignItems="start">

          {/* Navigation Sidebar */}
          <GridItem as="nav">
            <Stack gap={8}>
              {tabGroups.map((group) => (
                <Box key={group.title}>
                  <Text
                    fontSize="xs"
                    fontWeight="bold"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    color="gray.400"
                    mb={3}
                    px={3}
                  >
                    {group.title}
                  </Text>
                  <Stack gap={1}>
                    {group.items.map((tab) => (
                      <NavLink key={tab.path} to={tab.path}>
                        {({ isActive }) => (
                          <Box
                            className="group"
                            display="flex"
                            alignItems="center"
                            gap={3}
                            px={3}
                            py={2.5}
                            borderRadius="lg"
                            transition="all 0.2s ease-in-out"
                            position="relative"
                            bg={isActive ? "white" : "transparent"}
                            color={isActive ? "oxygen.700" : "gray.600"}
                            shadow={isActive ? "xs" : "none"}
                            border="1px solid"
                            borderColor={isActive ? "gray.200" : "transparent"}
                            _hover={{
                              bg: isActive ? "white" : "gray.100",
                              color: "oxygen.600",
                            }}
                          >
                            <Icon
                              as={tab.icon}
                              boxSize={5}
                              color={isActive ? "oxygen.500" : "gray.400"}
                              _groupHover={{ color: "oxygen.500" }}
                              transition="color 0.2s"
                            />
                            <Text fontWeight={isActive ? "semibold" : "medium"} fontSize="sm">
                              {tab.name}
                            </Text>

                            {/* Active Indicator Dot */}
                            {isActive && (
                              <Box
                                position="absolute"
                                right={3}
                                w={1.5}
                                h={1.5}
                                borderRadius="full"
                                bg="oxygen.500"
                              />
                            )}
                          </Box>
                        )}
                      </NavLink>
                    ))}
                  </Stack>
                </Box>
              ))}
            </Stack>

            {/* Contextual Footer Info */}
            <Box mt={10} px={3}>
              <Box p={4} bg="oxygen.50" borderRadius="lg" border="1px dashed" borderColor="oxygen.200">
                <Text fontSize="xs" color="oxygen.800" fontWeight="semibold" mb={1}>{t('footer.appName')}</Text>
                <Text fontSize="xs" color="oxygen.700">{t('footer.version')}</Text>
              </Box>
            </Box>
          </GridItem>

          {/* Main Content Area */}
          <GridItem minW={0} w="full">
            <Card.Root
              bg="white"
              borderRadius="2xl"
              borderColor="gray.200"
              shadow="sm"
              overflow="hidden"
              minH="600px"
            >
              <Card.Body p={{ base: 6, md: 10 }}>
                <Outlet />
              </Card.Body>
            </Card.Root>
          </GridItem>

        </Grid>
      </Container>
    </Box>
  )
}
