import React from 'react'
import { Typography, Select, Input, Alert, theme } from 'antd'
import { InfoCircleOutlined, WarningOutlined } from '@ant-design/icons'
import type { DeckFormData, DeckPreset } from '../types/FormTypes'

const { Title, Paragraph, Text } = Typography

interface DeckTypeSectionProps {
    formData: DeckFormData
    defaultDecks: DeckPreset[]
    onInputChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void
    getFieldError: (fieldName: string) => string | null
}

export function DeckTypeSection({ formData, defaultDecks, onInputChange, getFieldError }: DeckTypeSectionProps) {
    const { token } = theme.useToken()
    const error = getFieldError('deckType')
    const deckNameError = getFieldError('deckName')

    // Only show if languages are selected and valid
    const showSection = formData.sourceLanguage && formData.targetLanguage &&
        formData.sourceLanguage !== formData.targetLanguage

    if (!showSection) {
        return null
    }

    const hasEnglishDefaults = formData.sourceLanguage === 'en'
    const showDeckNameField = ['custom', 'ai-generated'].includes(formData.deckType)

    const handleSelectChange = (value: string) => {
        const syntheticEvent = {
            target: {
                name: 'deckType',
                value: value
            }
        } as React.ChangeEvent<HTMLSelectElement>
        onInputChange(syntheticEvent)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onInputChange(e)
    }

    const selectedDeck = defaultDecks.find(deck => deck.id === formData.deckType)

    return (
        <div style={{ marginBottom: token.marginLG }}>
            <div style={{ marginBottom: token.marginMD }}>
                <Title level={4} style={{ margin: 0, marginBottom: token.marginXS }}>
                    2. Choose Deck Type & Name
                </Title>
                <Paragraph style={{ color: token.colorTextSecondary, marginBottom: token.marginMD }}>
                    {hasEnglishDefaults
                        ? 'Select from pre-made English decks or create your own content.'
                        : 'Create your deck content using custom words or AI generation.'
                    }
                </Paragraph>
            </div>

            <div style={{ marginBottom: token.marginMD }}>
                <Text strong style={{ display: 'block', marginBottom: token.marginXS }}>
                    Deck Type
                </Text>
                <Select
                    value={formData.deckType}
                    onChange={handleSelectChange}
                    style={{ width: '100%' }}
                    size="large"
                    status={error ? 'error' : undefined}
                >
                    {hasEnglishDefaults && defaultDecks.map((deck) => (
                        <Select.Option key={deck.id} value={deck.id}>
                            {deck.name}
                        </Select.Option>
                    ))}
                    <Select.Option value="custom">Custom Word List</Select.Option>
                    <Select.Option value="ai-generated">AI Generated Deck</Select.Option>
                </Select>
                {error && (
                    <Text
                        type="danger"
                        style={{
                            display: 'block',
                            marginTop: token.marginXXS,
                            fontSize: token.fontSizeSM
                        }}
                    >
                        {error}
                    </Text>
                )}
            </div>

            {/* Show description for preset decks */}
            {hasEnglishDefaults && !['custom', 'ai-generated'].includes(formData.deckType) && selectedDeck && (
                <Alert
                    message={selectedDeck.name}
                    description={
                        <>
                            <div style={{ marginBottom: token.marginXXS }}>
                                {selectedDeck.description}
                            </div>
                            <Text style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary }}>
                                This preset deck will use its default name: "{selectedDeck.name}"
                            </Text>
                        </>
                    }
                    type="info"
                    icon={<InfoCircleOutlined />}
                    showIcon
                    style={{ marginBottom: token.marginMD }}
                />
            )}

            {/* Show info about non-English source languages */}
            {!hasEnglishDefaults && (
                <Alert
                    message="Note"
                    description="Pre-made decks are currently only available for English source language. You can use custom word lists or AI generation for other source languages."
                    type="warning"
                    icon={<WarningOutlined />}
                    showIcon
                    style={{ marginBottom: token.marginMD }}
                />
            )}

            {/* Deck Name Field - Only for custom and AI-generated decks */}
            {showDeckNameField && (
                <div>
                    <Text strong style={{ display: 'block', marginBottom: token.marginXS }}>
                        Deck Name (optional)
                    </Text>
                    <Input
                        name="deckName"
                        value={formData.deckName}
                        onChange={handleInputChange}
                        placeholder="Leave empty to auto-generate with AI"
                        size="large"
                        status={deckNameError ? 'error' : undefined}
                    />
                    {deckNameError && (
                        <Text
                            type="danger"
                            style={{
                                display: 'block',
                                marginTop: token.marginXXS,
                                fontSize: token.fontSizeSM
                            }}
                        >
                            {deckNameError}
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
                        If left empty, AI will generate a descriptive name based on your content and languages.
                    </Text>
                </div>
            )}
        </div>
    )
} 