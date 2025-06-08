import React from 'react'
import { Typography, Input, InputNumber, Checkbox, Divider, Card, theme } from 'antd'
import type { DeckFormData } from '../types/FormTypes'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

interface ContentInputSectionProps {
    formData: DeckFormData
    deckMode: {
        isCustomDeck: boolean
        isAiGeneratedDeck: boolean
        isPresetDeck: boolean
    }
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    getFieldError: (fieldName: string) => string | null
}

export function ContentInputSection({ formData, deckMode, onInputChange, getFieldError }: ContentInputSectionProps) {
    const { token } = theme.useToken()
    const wordsError = getFieldError('words')
    const aiPromptError = getFieldError('aiPrompt')
    const maxCardsError = getFieldError('maxCards')

    // Only show if deck type is selected and languages are valid
    const showSection = formData.deckType &&
        formData.sourceLanguage &&
        formData.targetLanguage &&
        formData.sourceLanguage !== formData.targetLanguage

    if (!showSection) {
        return null
    }

    const sourceLanguageName = getLanguageName(formData.sourceLanguage)
    const targetLanguageName = getLanguageName(formData.targetLanguage)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onInputChange(e)
    }

    const handleNumberChange = (value: number | null) => {
        const syntheticEvent = {
            target: {
                name: 'maxCards',
                value: value?.toString() || ''
            }
        } as React.ChangeEvent<HTMLInputElement>
        onInputChange(syntheticEvent)
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
                    3. Content & Audio
                </Title>
                <Paragraph style={{ color: token.colorTextSecondary, marginBottom: token.marginMD }}>
                    {deckMode.isAiGeneratedDeck && 'Describe what you want to learn and configure audio generation.'}
                    {deckMode.isCustomDeck && 'Enter the words or phrases you want to learn and configure audio.'}
                    {deckMode.isPresetDeck && 'Review the included words and configure audio generation.'}
                </Paragraph>
            </div>

            {/* AI Generated Deck Content */}
            {deckMode.isAiGeneratedDeck && (
                <>
                    <div style={{ marginBottom: token.marginMD }}>
                        <Text strong style={{ display: 'block', marginBottom: token.marginXS }}>
                            Max Cards (1-100)
                        </Text>
                        <InputNumber
                            min={1}
                            max={100}
                            value={formData.maxCards}
                            onChange={handleNumberChange}
                            style={{ width: '100%' }}
                            size="large"
                            status={maxCardsError ? 'error' : undefined}
                        />
                        {maxCardsError && (
                            <Text
                                type="danger"
                                style={{
                                    display: 'block',
                                    marginTop: token.marginXXS,
                                    fontSize: token.fontSizeSM
                                }}
                            >
                                {maxCardsError}
                            </Text>
                        )}
                    </div>

                    <div style={{ marginBottom: token.marginMD }}>
                        <Text strong style={{ display: 'block', marginBottom: token.marginXS }}>
                            AI Prompt
                        </Text>
                        <TextArea
                            name="aiPrompt"
                            value={formData.aiPrompt}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder={`Describe what kind of vocabulary you want to learn (e.g., '${formData.targetLanguage === 'es' ? 'Spanish' : formData.targetLanguage === 'fr' ? 'French' : 'Target language'} words for cooking and kitchen utensils')`}
                            size="large"
                            status={aiPromptError ? 'error' : undefined}
                        />
                        {aiPromptError && (
                            <Text
                                type="danger"
                                style={{
                                    display: 'block',
                                    marginTop: token.marginXXS,
                                    fontSize: token.fontSizeSM
                                }}
                            >
                                {aiPromptError}
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
                            Describe the topic or theme for your vocabulary deck. The AI will generate relevant words.
                        </Text>
                    </div>
                </>
            )}

            {/* Custom Word List */}
            {deckMode.isCustomDeck && (
                <div style={{ marginBottom: token.marginMD }}>
                    <Text strong style={{ display: 'block', marginBottom: token.marginXS }}>
                        Word List
                    </Text>
                    <TextArea
                        name="words"
                        value={formData.words}
                        onChange={handleInputChange}
                        rows={6}
                        placeholder="Enter words separated by commas (e.g., hello, world, good, bad)"
                        size="large"
                        status={wordsError ? 'error' : undefined}
                    />
                    {wordsError && (
                        <Text
                            type="danger"
                            style={{
                                display: 'block',
                                marginTop: token.marginXXS,
                                fontSize: token.fontSizeSM
                            }}
                        >
                            {wordsError}
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
                        Enter words or phrases separated by commas. Each will become a flashcard.
                    </Text>
                </div>
            )}

            {/* Preset Deck - Show current words (read-only) */}
            {deckMode.isPresetDeck && (
                <div style={{ marginBottom: token.marginMD }}>
                    <Text strong style={{ display: 'block', marginBottom: token.marginXS }}>
                        Included Words
                    </Text>
                    <Card
                        size="small"
                        style={{
                            background: token.colorBgLayout,
                            borderColor: token.colorBorder
                        }}
                    >
                        <Text
                            style={{
                                fontFamily: 'monospace',
                                fontSize: token.fontSizeSM
                            }}
                        >
                            {formData.words}
                        </Text>
                    </Card>
                    <Text
                        type="secondary"
                        style={{
                            display: 'block',
                            marginTop: token.marginXXS,
                            fontSize: token.fontSizeSM
                        }}
                    >
                        This preset includes {formData.words.split(',').length} words. Choose "Custom Word List" to modify.
                    </Text>
                </div>
            )}

            {/* Audio Generation Settings */}
            <Divider orientation="left" style={{ margin: `${token.marginMD}px 0` }}>
                <Text strong style={{ fontSize: token.fontSizeSM }}>
                    Audio Generation
                </Text>
            </Divider>

            <div style={{ marginBottom: token.marginMD }}>
                <div style={{ marginBottom: token.marginSM }}>
                    <Checkbox
                        id="generateSourceAudio"
                        checked={formData.generateSourceAudio}
                        onChange={handleCheckboxChange}
                    >
                        Generate audio for source language ({sourceLanguageName})
                    </Checkbox>
                </div>

                <div style={{ marginBottom: token.marginSM }}>
                    <Checkbox
                        id="generateTargetAudio"
                        checked={formData.generateTargetAudio}
                        onChange={handleCheckboxChange}
                    >
                        Generate audio for target language ({targetLanguageName})
                    </Checkbox>
                </div>

                <Text
                    type="secondary"
                    style={{
                        display: 'block',
                        fontSize: token.fontSizeSM
                    }}
                >
                    Audio generation helps with pronunciation. Disable to speed up deck creation.
                </Text>
            </div>
        </div>
    )
}

function getLanguageName(code: string): string {
    const languageNames: Record<string, string> = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'vi': 'Vietnamese',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh': 'Chinese',
        'ru': 'Russian'
    }
    return languageNames[code] || code.toUpperCase()
} 