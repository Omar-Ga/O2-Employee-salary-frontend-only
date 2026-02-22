import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, Flex, Heading, Input, Stack, Text, VStack, HStack, Spinner } from '@chakra-ui/react';
import { Field } from '@/components/ui/field';
import { InputGroup } from '@/components/ui/input-group';
import { useAuthStore } from '@/store/auth.store';
import { LuLock, LuMail, LuArrowRight } from 'react-icons/lu';
import { toaster } from '@/components/ui/toaster';
import { useTranslation } from 'react-i18next';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { authenticate, isLoading } = useAuthStore();
    const { t } = useTranslation(['auth']);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authenticate(email, password);
            toaster.success({
                title: t('login.toasts.successTitle'),
                description: t('login.toasts.successDescription')
            });
            navigate('/');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('login.toasts.errorDescription')
            toaster.error({
                title: t('login.toasts.errorTitle'),
                description: message
            });
        }
    };

    return (
        <Flex minH="100vh" w="100%">
            {/* Left Brand Area - Only visible on lg screens and up */}
            <Flex
                display={{ base: "none", lg: "flex" }}
                flex="1"
                bg="oxygen.950"
                position="relative"
                overflow="hidden"
                align="center"
                justify="center"
                p="12"
            >
                {/* Organic Glowing Orbs for the "Oxygen" effect */}
                <Box
                    position="absolute"
                    top="-10%"
                    left="-10%"
                    w="40vw"
                    h="40vw"
                    bg="oxygen.500"
                    borderRadius="full"
                    filter="blur(160px)"
                    opacity="0.3"
                />
                <Box
                    position="absolute"
                    bottom="-20%"
                    right="-10%"
                    w="35vw"
                    h="35vw"
                    bg="teal.600"
                    borderRadius="full"
                    filter="blur(160px)"
                    opacity="0.2"
                />

                <VStack align="flex-start" zIndex="1" maxW="lg" gap="8">
                    <HStack gap="2" align="baseline">
                        <Heading size="3xl" color="white" letterSpacing="tight" fontWeight="bold">
                            O2mation
                        </Heading>
                        <Box w="2" h="2" borderRadius="full" bg="oxygen.500" alignSelf="center" />
                        <Heading size="3xl" color="whiteAlpha.600" letterSpacing="tight" fontWeight="normal">
                            Salaries
                        </Heading>
                    </HStack>
                    <Text fontSize="xl" color="whiteAlpha.800" lineHeight="tall">
                        {t('login.brand.subtitle')}
                    </Text>
                    <Box mt="8" p="6" bg="whiteAlpha.100" backdropFilter="blur(10px)" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.200">
                        <Text color="whiteAlpha.900" fontStyle="italic" fontSize="md">
                            {t('login.brand.quote')}
                        </Text>
                    </Box>
                </VStack>
            </Flex>

            {/* Right Form Area */}
            <Flex
                flex="1"
                bg="white"
                _dark={{ bg: 'gray.900' }}
                align="center"
                justify="center"
                p={{ base: 6, md: 12 }}
            >
                <Container maxW="md">
                    <Stack gap="10" as="form" onSubmit={handleLogin} w="full">
                        <Stack gap="3">
                            {/* Mobile Logo Visibility */}
                            <HStack gap="2" display={{ base: "flex", lg: "none" }} mb="4" align="baseline">
                                <Heading size="xl" letterSpacing="tight" fontWeight="bold" color="oxygen.600" _dark={{ color: "oxygen.400" }}>
                                    O2mation
                                </Heading>
                                <Box w="1.5" h="1.5" borderRadius="full" bg="oxygen.500" alignSelf="center" />
                                <Heading size="xl" letterSpacing="tight" fontWeight="normal" color="gray.400">
                                    Salaries
                                </Heading>
                            </HStack>

                            <Heading size="3xl" letterSpacing="tight">{t('login.welcome')}</Heading>
                            <Text color="fg.muted" fontSize="md">
                                {t('login.description')}
                            </Text>
                        </Stack>

                        <Stack gap="6">
                            <Field label={t('login.labels.email')} required>
                                <InputGroup startElement={<LuMail color="gray.500" />} w="full">
                                    <Input
                                        type="email"
                                        size="lg"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={t('login.placeholders.email')}
                                        focusRingColor="oxygen.500"
                                        borderRadius="lg"
                                    />
                                </InputGroup>
                            </Field>

                            <Field label={t('login.labels.password')} required>
                                <InputGroup startElement={<LuLock color="gray.500" />} w="full">
                                    <Input
                                        type="password"
                                        size="lg"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder={t('login.placeholders.password')}
                                        focusRingColor="oxygen.500"
                                        borderRadius="lg"
                                    />
                                </InputGroup>
                            </Field>

                            <Button
                                type="submit"
                                colorPalette="oxygen"
                                size="xl"
                                mt="4"
                                w="full"
                                borderRadius="lg"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Spinner size="sm" mr="2" /> {t('login.buttons.signIn')}
                                    </>
                                ) : (
                                    <>
                                        {t('login.buttons.continue')} <LuArrowRight />
                                    </>
                                )}
                            </Button>
                        </Stack>

                        <Text textAlign="center" fontSize="sm" color="fg.muted" mt="8">
                            {t('login.footer')}
                        </Text>
                    </Stack>
                </Container>
            </Flex>
        </Flex>
    );
};
