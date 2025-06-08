import React from 'react'
import { Typography, Select, Card, Row, Col, theme } from 'antd'
import type { DeckFormData } from '../types/FormTypes'

const { Title, Paragraph, Text } = Typography

interface CardDirectionSectionProps {
    formData: DeckFormData
    onInputChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

export function CardDirectionSection({ formData, onInputChange }: CardDirectionSectionProps) {
    const { token } = theme.useToken()

    // Only show if we have content (words or AI prompt) and languages are selected
    const hasContent = (formData.deckType === 'ai-generated' && formData.aiPrompt) ||
        (formData.deckType !== 'ai-generated' && formData.words)

    const showSection = formData.sourceLanguage && formData.targetLanguage &&
        formData.sourceLanguage !== formData.targetLanguage &&
        hasContent

    if (!showSection) {
        return null
    }

    const sourceLanguageName = getLanguageName(formData.sourceLanguage)
    const targetLanguageName = getLanguageName(formData.targetLanguage)

    const handleSelectChange = (value: string) => {
        // Create a synthetic event to match the existing interface
        const syntheticEvent = {
            target: {
                name: 'cardDirection',
                value: value
            }
        } as React.ChangeEvent<HTMLSelectElement>
        onInputChange(syntheticEvent)
    }

    return (
        <div style={{ marginBottom: token.marginLG }}>
            <div style={{ marginBottom: token.marginMD }}>
                <Title level={4} style={{ margin: 0, marginBottom: token.marginXS }}>
                    4. Card Direction
                </Title>
                <Paragraph style={{ color: token.colorTextSecondary, marginBottom: token.marginMD }}>
                    Choose how to arrange your cards. This determines what you'll see on the front and back of each flashcard.
                </Paragraph>
            </div>

            <div style={{ marginBottom: token.marginMD }}>
                <Text strong style={{ display: 'block', marginBottom: token.marginXS }}>
                    Card Layout
                </Text>
                <Select
                    value={formData.cardDirection || 'source-to-target'}
                    onChange={handleSelectChange}
                    style={{ width: '100%' }}
                    size="large"
                >
                    <Select.Option value="source-to-target">
                        {sourceLanguageName} → {targetLanguageName} (Front: {sourceLanguageName}, Back: {targetLanguageName})
                    </Select.Option>
                    <Select.Option value="target-to-source">
                        {targetLanguageName} → {sourceLanguageName} (Front: {targetLanguageName}, Back: {sourceLanguageName})
                    </Select.Option>
                </Select>
                <Text
                    type="secondary"
                    style={{
                        display: 'block',
                        marginTop: token.marginXXS,
                        fontSize: token.fontSizeSM
                    }}
                >
                    Choose which language appears on the front of your flashcards
                </Text>
            </div>

            {/* Preview */}
            <Card
                title="Card Preview:"
                size="small"
                style={{
                    background: token.colorBgLayout,
                    borderColor: token.colorBorder
                }}
                headStyle={{
                    fontSize: token.fontSizeSM,
                    fontWeight: 500,
                    color: token.colorTextSecondary,
                    minHeight: 'auto',
                    padding: `${token.paddingSM}px ${token.padding}px`
                }}
                bodyStyle={{ padding: token.padding }}
            >
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                        <Card
                            size="small"
                            style={{
                                background: token.colorBgContainer,
                                borderColor: token.colorBorder
                            }}
                        >
                            <Text
                                type="secondary"
                                style={{
                                    fontSize: token.fontSizeSM,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.025em',
                                    display: 'block',
                                    marginBottom: token.marginXXS
                                }}
                            >
                                Front
                            </Text>
                            <Text strong>
                                {(formData.cardDirection || 'source-to-target') === 'source-to-target'
                                    ? `[${sourceLanguageName} word/phrase]`
                                    : `[${targetLanguageName} word/phrase]`
                                }
                            </Text>
                        </Card>
                    </Col>
                    <Col xs={24} md={12}>
                        <Card
                            size="small"
                            style={{
                                background: token.colorBgContainer,
                                borderColor: token.colorBorder
                            }}
                        >
                            <Text
                                type="secondary"
                                style={{
                                    fontSize: token.fontSizeSM,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.025em',
                                    display: 'block',
                                    marginBottom: token.marginXXS
                                }}
                            >
                                Back
                            </Text>
                            <Text strong>
                                {(formData.cardDirection || 'source-to-target') === 'source-to-target'
                                    ? `[${targetLanguageName} translation]`
                                    : `[${sourceLanguageName} translation]`
                                }
                            </Text>
                        </Card>
                    </Col>
                </Row>
            </Card>
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
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh': 'Chinese',
        'ru': 'Russian',
        'vi': 'Vietnamese'
    }
    return languageNames[code] || code.toUpperCase()
} 