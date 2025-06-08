import React from 'react'
import { Typography, Select, Input, Alert, Row, Col, theme } from 'antd'
import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons'
import type { DeckFormData } from '../types/FormTypes'

const { Title, Paragraph, Text } = Typography

interface LanguageSelectionSectionProps {
    formData: DeckFormData
    onInputChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void
    getFieldError: (fieldName: string) => string | null
}

export function LanguageSelectionSection({ formData, onInputChange, getFieldError }: LanguageSelectionSectionProps) {
    const { token } = theme.useToken()
    const sourceLanguageError = getFieldError('sourceLanguage')
    const targetLanguageError = getFieldError('targetLanguage')

    // Check if custom language is selected
    const isSourceCustom = !['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ru', 'vi'].includes(formData.sourceLanguage) && formData.sourceLanguage !== ''
    const isTargetCustom = !['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ru', 'vi'].includes(formData.targetLanguage) && formData.targetLanguage !== ''

    const handleLanguageChange = (value: string, type: 'source' | 'target') => {
        if (value === 'other') {
            // Clear the language when "other" is selected to show input field
            const syntheticEvent = {
                target: { name: type === 'source' ? 'sourceLanguage' : 'targetLanguage', value: 'custom' }
            } as React.ChangeEvent<HTMLInputElement>
            onInputChange(syntheticEvent)
        } else {
            const syntheticEvent = {
                target: { name: type === 'source' ? 'sourceLanguage' : 'targetLanguage', value: value }
            } as React.ChangeEvent<HTMLSelectElement>
            onInputChange(syntheticEvent)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onInputChange(e)
    }

    const languageOptions = [
        { value: '', label: 'Select language' },
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
        { value: 'fr', label: 'French' },
        { value: 'de', label: 'German' },
        { value: 'it', label: 'Italian' },
        { value: 'pt', label: 'Portuguese' },
        { value: 'vi', label: 'Vietnamese' },
        { value: 'ja', label: 'Japanese' },
        { value: 'ko', label: 'Korean' },
        { value: 'zh', label: 'Chinese' },
        { value: 'ru', label: 'Russian' },
        { value: 'other', label: 'Other (specify below)' }
    ]

    return (
        <div style={{ marginBottom: token.marginLG }}>
            <div style={{ marginBottom: token.marginMD }}>
                <Title level={4} style={{ margin: 0, marginBottom: token.marginXS }}>
                    1. Select Languages
                </Title>
                <Paragraph style={{ color: token.colorTextSecondary, marginBottom: token.marginMD }}>
                    Choose your source and target languages first. This will determine what deck options are available.
                </Paragraph>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: token.marginMD }}>
                <Col xs={24} md={12}>
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: token.marginXS }}>
                            Source Language *
                        </Text>
                        <Select
                            value={isSourceCustom ? 'other' : formData.sourceLanguage}
                            onChange={(value) => handleLanguageChange(value, 'source')}
                            style={{ width: '100%' }}
                            size="large"
                            placeholder="Select source language"
                            status={sourceLanguageError ? 'error' : undefined}
                            options={languageOptions}
                        />

                        {(isSourceCustom || formData.sourceLanguage === 'custom') && (
                            <Input
                                name="sourceLanguage"
                                value={formData.sourceLanguage === 'custom' ? '' : formData.sourceLanguage}
                                onChange={handleInputChange}
                                placeholder="Enter language code (e.g., 'th' for Thai, 'ar' for Arabic)"
                                size="large"
                                status={sourceLanguageError ? 'error' : undefined}
                                style={{ marginTop: token.marginXS }}
                            />
                        )}

                        {sourceLanguageError && (
                            <Text
                                type="danger"
                                style={{
                                    display: 'block',
                                    marginTop: token.marginXXS,
                                    fontSize: token.fontSizeSM
                                }}
                            >
                                {sourceLanguageError}
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
                            {isSourceCustom || formData.sourceLanguage === 'custom'
                                ? 'Enter a language code (e.g., "th", "ar", "hi") for your input language'
                                : 'The language of your input words or prompts'
                            }
                        </Text>
                    </div>
                </Col>

                <Col xs={24} md={12}>
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: token.marginXS }}>
                            Target Language *
                        </Text>
                        <Select
                            value={isTargetCustom ? 'other' : formData.targetLanguage}
                            onChange={(value) => handleLanguageChange(value, 'target')}
                            style={{ width: '100%' }}
                            size="large"
                            placeholder="Select target language"
                            status={targetLanguageError ? 'error' : undefined}
                            options={languageOptions}
                        />

                        {(isTargetCustom || formData.targetLanguage === 'custom') && (
                            <Input
                                name="targetLanguage"
                                value={formData.targetLanguage === 'custom' ? '' : formData.targetLanguage}
                                onChange={handleInputChange}
                                placeholder="Enter language code (e.g., 'th' for Thai, 'ar' for Arabic)"
                                size="large"
                                status={targetLanguageError ? 'error' : undefined}
                                style={{ marginTop: token.marginXS }}
                            />
                        )}

                        {targetLanguageError && (
                            <Text
                                type="danger"
                                style={{
                                    display: 'block',
                                    marginTop: token.marginXXS,
                                    fontSize: token.fontSizeSM
                                }}
                            >
                                {targetLanguageError}
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
                            {isTargetCustom || formData.targetLanguage === 'custom'
                                ? 'Enter a language code (e.g., "th", "ar", "hi") for the language you want to learn'
                                : 'The language you want to learn'
                            }
                        </Text>
                    </div>
                </Col>
            </Row>

            {formData.sourceLanguage === formData.targetLanguage && formData.sourceLanguage && (
                <Alert
                    message="Language Conflict"
                    description="Source and target languages cannot be the same. Please select different languages."
                    type="warning"
                    icon={<WarningOutlined />}
                    showIcon
                    style={{ marginBottom: token.marginMD }}
                />
            )}

            {formData.sourceLanguage && formData.targetLanguage && formData.sourceLanguage !== formData.targetLanguage && (
                <Alert
                    message="Languages Selected"
                    description={
                        <>
                            Languages selected: {formData.sourceLanguage.toUpperCase()} → {formData.targetLanguage.toUpperCase()}
                            {formData.sourceLanguage === 'en' && (
                                <div style={{ marginTop: token.marginXXS }}>
                                    Default English decks are available in the next step!
                                </div>
                            )}
                        </>
                    }
                    type="success"
                    icon={<CheckCircleOutlined />}
                    showIcon
                    style={{ marginBottom: token.marginMD }}
                />
            )}
        </div>
    )
} 