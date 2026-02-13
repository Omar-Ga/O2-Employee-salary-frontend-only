import { 
  Box, 
  Heading, 
  Text, 
  Flex, 
  Button, 
  HStack, 
  Icon, 
  Card,
  Separator
} from "@chakra-ui/react"
import { 
  MenuRoot, 
  MenuTrigger, 
  MenuContent, 
  MenuRadioItemGroup, 
  MenuRadioItem 
} from "@/components/ui/menu"
import { useTranslation } from "react-i18next"
import { LuLanguages, LuChevronDown } from "react-icons/lu"

export const PreferencesTab = () => {
  const { t, i18n } = useTranslation('settings')

  const languages = [
    { value: "en", label: t('preferences.language.english'), subLabel: t('preferences.language.us') },
    { value: "ar", label: t('preferences.language.arabic'), subLabel: t('preferences.language.ar') },
  ]

  const currentLang = languages.find(l => i18n.language.startsWith(l.value)) || languages[0]

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value)
    document.dir = value === 'ar' ? 'rtl' : 'ltr'
  }

  return (
    <Box maxW="3xl" animation="fade-in 0.5s ease-out">
      <Box mb={8}>
        <Heading size="2xl" mb={2} letterSpacing="-0.02em">{t('preferences.title')}</Heading>
        <Text color="gray.500" fontSize="lg">
          {t('preferences.subtitle')}
        </Text>
      </Box>

      <Card.Root variant="outline" size="lg" borderRadius="xl" overflow="hidden" borderColor="gray.200">
        <Card.Header bg="gray.50" borderBottomWidth="1px" borderColor="gray.100" py={4}>
          <HStack gap={3}>
            <Box p={2} bg="white" borderRadius="md" shadow="xs" color="oxygen.500">
              <Icon as={LuLanguages} boxSize={5} />
            </Box>
            <Box>
              <Heading size="sm" fontWeight="semibold">{t('preferences.language.title')}</Heading>
              <Text fontSize="xs" color="gray.500">{t('preferences.language.subtitle')}</Text>
            </Box>
          </HStack>
        </Card.Header>
        
        <Card.Body p={8}>
          <Flex align="center" justify="space-between" gap={8} wrap={{ base: "wrap", md: "nowrap" }}>
            <Box flex="1">
              <Text fontWeight="medium" mb={1} fontSize="md">{t('preferences.language.interfaceLabel')}</Text>
              <Text fontSize="sm" color="gray.500" lineHeight="tall">
                {t('preferences.language.description')}
              </Text>
            </Box>

            <Box minW="240px">
              <MenuRoot>
                <MenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    w="full" 
                    justifyContent="space-between" 
                    size="lg"
                    borderColor="gray.300"
                    _hover={{ borderColor: "oxygen.400", bg: "oxygen.50/30" }}
                    _active={{ bg: "oxygen.50" }}
                    fontWeight="medium"
                  >
                    <HStack gap={3}>
                      <Text>{currentLang.label}</Text>
                      <Text color="gray.400" fontSize="xs" fontWeight="normal">({currentLang.subLabel})</Text>
                    </HStack>
                    <Icon as={LuChevronDown} color="gray.400" />
                  </Button>
                </MenuTrigger>
                <MenuContent minW="240px">
                  <MenuRadioItemGroup 
                    value={i18n.language} 
                    onValueChange={(e) => handleLanguageChange(e.value)}
                  >
                    {languages.map((lang) => (
                      <MenuRadioItem 
                        key={lang.value} 
                        value={lang.value}
                        cursor="pointer"
                        _hover={{ bg: "gray.50" }}
                      >
                        <Box flex="1">
                          <Text fontWeight="medium">{lang.label}</Text>
                          <Text fontSize="xs" color="gray.500">{lang.subLabel}</Text>
                        </Box>
                      </MenuRadioItem>
                    ))}
                  </MenuRadioItemGroup>
                </MenuContent>
              </MenuRoot>
            </Box>
          </Flex>

          <Separator my={8} borderColor="gray.100" />

          <Flex align="center" justify="space-between">
             <Text fontSize="xs" color="gray.400">
               {t('preferences.moreComingSoon')}
             </Text>
          </Flex>

        </Card.Body>
      </Card.Root>
    </Box>
  )
}
