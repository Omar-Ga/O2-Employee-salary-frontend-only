import { Box, Flex, LocaleProvider } from "@chakra-ui/react"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { Outlet } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useEffect } from "react"

export const DashboardLayout = () => {
  const { i18n } = useTranslation()
  const dir = i18n.dir()

  useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = i18n.language
  }, [dir, i18n.language])

  return (
    <LocaleProvider locale={i18n.language}>
      <Flex direction={dir === 'rtl' ? 'row-reverse' : 'row'} bg="gray.50" minH="100vh" dir={dir}>
        <Sidebar />
        <Flex direction="column" flex="1" overflow="hidden" ms={{ base: 0, md: "280px" }}>
          <Topbar />
          <Box flex="1" overflowY="auto" p="8">
            <Outlet />
          </Box>
        </Flex>
      </Flex>
    </LocaleProvider>
  )
}
