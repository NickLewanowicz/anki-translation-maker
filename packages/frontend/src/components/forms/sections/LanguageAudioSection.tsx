import React from 'react'
import { Typography, Input, Select, Checkbox, Row, Col, Card, theme } from 'antd'
import { LinkOutlined } from '@ant-design/icons'
import type { DeckFormData } from '../types/FormTypes'

const { Title, Paragraph, Text, Link } = Typography
const { TextArea } = Input

interface ModelSettingsSectionProps {
    formData: DeckFormData
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
    getFieldError: (fieldName: string) => string | null
}

export function ModelSettingsSection({ formData, onInputChange, getFieldError }: ModelSettingsSectionProps) {
    const { token } = theme.useToken()
    const apiKeyError = getFieldError('replicateApiKey')
    const textModelError = getFieldError('textModel')
    const voiceModelError = getFieldError('voiceModel')
    const textArgsError = getFieldError('textModelArgs')
    const voiceArgsError = getFieldError('voiceModelArgs')

    // Only show if we have content and card direction is configured
    const hasContent = (formData.deckType === 'ai-generated' && formData.aiPrompt) ||
        (formData.deckType !== 'ai-generated' && formData.words)

    const showSection = formData.sourceLanguage && formData.targetLanguage &&
        formData.sourceLanguage !== formData.targetLanguage &&
        hasContent

    if (!showSection) {
        return null
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onInputChange(e)
    }

    const handleTextModelChange = (value: string) => {
        if (value === 'openai/gpt-4o-mini') {
            const syntheticEvent = {
                target: { name: 'textModel', value: 'openai/gpt-4o-mini' }
            } as React.ChangeEvent<HTMLInputElement>
            onInputChange(syntheticEvent)
        } else {
            const syntheticEvent = {
                target: { name: 'textModel', value: '' }
            } as React.ChangeEvent<HTMLInputElement>
            onInputChange(syntheticEvent)
        }
    }

    const handleVoiceModelChange = (value: string) => {
        if (value === 'minimax/speech-02-hd') {
            const syntheticEvent = {
                target: { name: 'voiceModel', value: 'minimax/speech-02-hd' }
            } as React.ChangeEvent<HTMLInputElement>
            onInputChange(syntheticEvent)
        } else {
            const syntheticEvent = {
                target: { name: 'voiceModel', value: '' }
            } as React.ChangeEvent<HTMLInputElement>
            onInputChange(syntheticEvent)
        }
    }

    const handleCheckboxChange = (e: any) => {
        const syntheticEvent = {
            target: {
                name: e.target.id,
                checked: e.target.checked
            }
        } as React.ChangeEvent<HTMLInputElement>
        onInputChange(syntheticEvent)
    }

    return (
        <div style={{ marginBottom: token.marginLG }}>
            <div style={{ marginBottom: token.marginMD }}>
                <Title level={4} style={{ margin: 0, marginBottom: token.marginXS }}>
                    5. Model & AI Settings
                </Title>
                <Paragraph style={{ color: token.colorTextSecondary, marginBottom: token.marginMD }}>
                    Configure your API key and select AI models for translation and audio generation.
                </Paragraph>
            </div>

            {/* API Key */}
            <div style={{ marginBottom: token.marginMD }}>
                <Text strong style={{ display: 'block', marginBottom: token.marginXS }}>
                    Replicate API Key *
                </Text>
                <Input.Password
                    name="replicateApiKey"
                    value={formData.replicateApiKey}
                    onChange={handleInputChange}
                    placeholder="r8_..."
                    size="large"
                    status={apiKeyError ? 'error' : undefined}
                />
                {apiKeyError && (
                    <Text
                        type="danger"
                        style={{
                            display: 'block',
                            marginTop: token.marginXXS,
                            fontSize: token.fontSizeSM
                        }}
                    >
                        {apiKeyError}
                    </Text>
                )}
                <Text
                    type="secondary"
                    style={{
                        display: 'block',
                        marginTop: token.marginXXS,
                        fontSize: token.fontSizeSM
                    }}
                >
                    Your Replicate API key is required for AI translation and audio generation.{' '}
                    <Link
                        href="https://replicate.com/account/api-tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <LinkOutlined /> Get your key here
                    </Link>
                </Text>
            </div>

            {/* Model Selection */}
            <Row gutter={[16, 16]} style={{ marginBottom: token.marginMD }}>
                <Col xs={24} md={12}>
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: token.marginXS }}>
                            Text Model
                        </Text>
                        <Select
                            value={formData.textModel === 'openai/gpt-4o-mini' ? 'openai/gpt-4o-mini' : 'custom'}
                            onChange={handleTextModelChange}
                            style={{ width: '100%' }}
                            size="large"
                            status={textModelError ? 'error' : undefined}
                        >
                            <Select.Option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini (recommended)</Select.Option>
                            <Select.Option value="custom">Custom Model</Select.Option>
                        </Select>
                        {formData.textModel !== 'openai/gpt-4o-mini' && (
                            <Input
                                name="textModel"
                                value={formData.textModel}
                                onChange={handleInputChange}
                                placeholder="e.g., openai/gpt-4o, meta/llama-3.1-70b-instruct"
                                size="large"
                                status={textModelError ? 'error' : undefined}
                                style={{ marginTop: token.marginXS }}
                            />
                        )}
                        {textModelError && (
                            <Text
                                type="danger"
                                style={{
                                    display: 'block',
                                    marginTop: token.marginXXS,
                                    fontSize: token.fontSizeSM
                                }}
                            >
                                {textModelError}
                            </Text>
                        )}
                        <Text
                            type="secondary"
                            style={{
                                display: 'block',
                                marginTop: token.marginXXS,
                                fontSize: token.fontSizeSM
                            }}
                        >
                            {formData.textModel === 'openai/gpt-4o-mini'
                                ? 'Tested and recommended for translation and deck name generation'
                                : 'Enter a custom model identifier (e.g., openai/gpt-4o)'
                            }
                        </Text>
                    </div>
                </Col>

                <Col xs={24} md={12}>
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: token.marginXS }}>
                            Voice Model
                        </Text>
                        <Select
                            value={formData.voiceModel === 'minimax/speech-02-hd' ? 'minimax/speech-02-hd' : 'custom'}
                            onChange={handleVoiceModelChange}
                            style={{ width: '100%' }}
                            size="large"
                            status={voiceModelError ? 'error' : undefined}
                        >
                            <Select.Option value="minimax/speech-02-hd">Minimax Speech 02 HD (recommended)</Select.Option>
                            <Select.Option value="custom">Custom Model</Select.Option>
                        </Select>
                        {formData.voiceModel !== 'minimax/speech-02-hd' && (
                            <Input
                                name="voiceModel"
                                value={formData.voiceModel}
                                onChange={handleInputChange}
                                placeholder="e.g., parler-tts/parler-tts-large-v1"
                                size="large"
                                status={voiceModelError ? 'error' : undefined}
                                style={{ marginTop: token.marginXS }}
                            />
                        )}
                        {voiceModelError && (
                            <Text
                                type="danger"
                                style={{
                                    display: 'block',
                                    marginTop: token.marginXXS,
                                    fontSize: token.fontSizeSM
                                }}
                            >
                                {voiceModelError}
                            </Text>
                        )}
                        <Text
                            type="secondary"
                            style={{
                                display: 'block',
                                marginTop: token.marginXXS,
                                fontSize: token.fontSizeSM
                            }}
                        >
                            {formData.voiceModel === 'minimax/speech-02-hd'
                                ? 'Tested and recommended for audio generation'
                                : 'Enter a custom model identifier (e.g., parler-tts/parler-tts-mini-v1)'
                            }
                        </Text>
                    </div>
                </Col>
            </Row>

            {/* Advanced Model Arguments */}
            <div style={{ marginBottom: token.marginMD }}>
                <div style={{ marginBottom: token.marginSM }}>
                    <Checkbox
                        id="useCustomArgs"
                        checked={formData.useCustomArgs}
                        onChange={handleCheckboxChange}
                    >
                        Use custom model arguments (advanced)
                    </Checkbox>
                </div>

                {formData.useCustomArgs && (
                    <Card
                        size="small"
                        style={{
                            background: token.colorBgLayout,
                            borderColor: token.colorBorder,
                            marginTop: token.marginSM
                        }}
                    >
                        <Row gutter={[16, 16]}>
                            <Col xs={24} md={12}>
                                <div>
                                    <Text strong style={{ display: 'block', marginBottom: token.marginXS }}>
                                        Text Model Arguments
                                    </Text>
                                    <TextArea
                                        name="textModelArgs"
                                        value={formData.textModelArgs}
                                        onChange={handleInputChange}
                                        rows={3}
                                        placeholder='{"temperature": 0.7, "max_tokens": 100}'
                                        size="large"
                                        status={textArgsError ? 'error' : undefined}
                                        style={{ fontFamily: 'monospace', fontSize: token.fontSizeSM }}
                                    />
                                    {textArgsError && (
                                        <Text
                                            type="danger"
                                            style={{
                                                display: 'block',
                                                marginTop: token.marginXXS,
                                                fontSize: token.fontSizeSM
                                            }}
                                        >
                                            {textArgsError}
                                        </Text>
                                    )}
                                    <Text
                                        type="secondary"
                                        style={{
                                            display: 'block',
                                            marginTop: token.marginXXS,
                                            fontSize: token.fontSizeSM
                                        }}
                                    >
                                        JSON object with model parameters
                                    </Text>
                                </div>
                            </Col>

                            <Col xs={24} md={12}>
                                <div>
                                    <Text strong style={{ display: 'block', marginBottom: token.marginXS }}>
                                        Voice Model Arguments
                                    </Text>
                                    <TextArea
                                        name="voiceModelArgs"
                                        value={formData.voiceModelArgs}
                                        onChange={handleInputChange}
                                        rows={3}
                                        placeholder='{"speed": 1.0, "voice": "default"}'
                                        size="large"
                                        status={voiceArgsError ? 'error' : undefined}
                                        style={{ fontFamily: 'monospace', fontSize: token.fontSizeSM }}
                                    />
                                    {voiceArgsError && (
                                        <Text
                                            type="danger"
                                            style={{
                                                display: 'block',
                                                marginTop: token.marginXXS,
                                                fontSize: token.fontSizeSM
                                            }}
                                        >
                                            {voiceArgsError}
                                        </Text>
                                    )}
                                    <Text
                                        type="secondary"
                                        style={{
                                            display: 'block',
                                            marginTop: token.marginXXS,
                                            fontSize: token.fontSizeSM
                                        }}
                                    >
                                        JSON object with voice parameters
                                    </Text>
                                </div>
                            </Col>
                        </Row>
                    </Card>
                )}

                <Text
                    type="secondary"
                    style={{
                        display: 'block',
                        marginTop: token.marginXS,
                        fontSize: token.fontSizeSM
                    }}
                >
                    Advanced users can customize model behavior with JSON parameters. Leave unchecked for optimal defaults.
                </Text>
            </div>
        </div>
    )
} 