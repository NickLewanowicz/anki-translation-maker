import React, { useState } from 'react'
import { Form, Button, Alert, Spin, Space, theme } from 'antd'
import { DownloadOutlined, LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import { deckService } from '../services/deckService'
import { analyticsService } from '../services/analyticsService'
import { useFormState } from './forms/hooks/useFormState'
import { LanguageSelectionSection } from './forms/sections/LanguageSelectionSection'
import { DeckTypeSection } from './forms/sections/DeckTypeSection'
import { ContentInputSection } from './forms/sections/ContentInputSection'
import { CardDirectionSection } from './forms/sections/CardDirectionSection'
import { ModelSettingsSection } from './forms/sections/LanguageAudioSection'

export function DeckGeneratorForm() {
    const { token } = theme.useToken()
    const [isGenerating, setIsGenerating] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [testResult, setTestResult] = useState<string | null>(null)

    const {
        formData,
        errors,
        isLocalStorageLoaded,
        deckMode,
        defaultDecks,
        handleInputChange,
        clearStoredData,
        isFormValid,
        getFieldError,
        getSubmitData
    } = useFormState()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isFormValid()) {
            setError('Please fix the validation errors before submitting')
            return
        }

        setIsGenerating(true)
        setError(null)

        // Track form submission start
        const submissionStartTime = Date.now()
        analyticsService.trackFormSubmission('deck_generation', {
            deck_type: formData.deckType,
            front_language: formData.sourceLanguage,
            back_language: formData.targetLanguage,
            text_model: formData.textModel,
            voice_model: formData.voiceModel,
            max_cards: formData.maxCards,
            has_custom_args: formData.useCustomArgs,
            has_front_audio: formData.generateSourceAudio,
            has_back_audio: formData.generateTargetAudio,
            has_custom_deck_name: !!formData.deckName,
            generation_method: formData.deckType === 'ai-generated' ? 'ai_prompt' : 'word_list',
            word_count: formData.words ? formData.words.split(',').filter(w => w.trim()).length : 0,
            prompt_length: formData.aiPrompt ? formData.aiPrompt.length : 0,
            card_direction: formData.cardDirection
        })

        try {
            const submitData = getSubmitData()
            console.log('Submitting deck generation request:', {
                deckType: formData.deckType,
                wordsCount: submitData.words ? submitData.words.split(',').length : 0,
                aiPrompt: submitData.aiPrompt ? '***provided***' : 'none',
                sourceLanguage: submitData.sourceLanguage,
                targetLanguage: submitData.targetLanguage,
                textModel: submitData.textModel,
                voiceModel: submitData.voiceModel,
                useCustomArgs: submitData.useCustomArgs,
                cardDirection: formData.cardDirection
            })

            await deckService.generateDeck(submitData)

            // Track successful deck generation
            const generationTime = Date.now() - submissionStartTime
            analyticsService.trackDeckGenerated({
                cardCount: formData.words ? formData.words.split(',').filter(w => w.trim()).length : formData.maxCards,
                sourceLanguage: formData.sourceLanguage,
                targetLanguage: formData.targetLanguage,
                hasSourceAudio: formData.generateSourceAudio,
                hasTargetAudio: formData.generateTargetAudio,
                textModel: formData.textModel,
                voiceModel: formData.voiceModel,
                generationMethod: formData.deckType === 'ai-generated' ? 'ai_prompt' : 'word_list',
                customArgsUsed: formData.useCustomArgs
            })

            // Track timing for performance analytics
            analyticsService.trackTiming('deck_generation', 'total_time', generationTime, formData.deckType)

        } catch (err) {
            console.error('Deck generation error:', err)
            const errorMessage = err instanceof Error ? err.message : 'An error occurred'
            setError(errorMessage)

            // Track deck generation error
            const generationTime = Date.now() - submissionStartTime
            analyticsService.trackDeckError(errorMessage, {
                deck_type: formData.deckType,
                front_language: formData.sourceLanguage,
                back_language: formData.targetLanguage,
                text_model: formData.textModel,
                voice_model: formData.voiceModel,
                generation_time: generationTime
            })
        } finally {
            setIsGenerating(false)
        }
    }

    const handleTestConfiguration = async () => {
        if (!isFormValid()) {
            setTestResult('Please fix the validation errors before testing')
            return
        }

        setIsTesting(true)
        setTestResult(null)

        try {
            const submitData = getSubmitData()
            await deckService.validateConfiguration(submitData)
            setTestResult('✅ Configuration is valid! Ready to generate deck.')
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Configuration test failed'
            setTestResult(`❌ ${errorMessage}`)
        } finally {
            setIsTesting(false)
        }
    }

    const handleClearStoredData = () => {
        clearStoredData()
        setError(null)
        setTestResult(null)
        console.log('🗑️ Cleared all stored data')
    }

    // Show loading state while localStorage is being loaded
    if (!isLocalStorageLoaded) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: `${token.paddingLG}px 0`
            }}>
                <Spin
                    indicator={<LoadingOutlined style={{ fontSize: 24, color: token.colorPrimary }} spin />}
                    size="large"
                />
                <span style={{
                    marginLeft: token.marginSM,
                    color: token.colorTextSecondary
                }}>
                    Loading saved data...
                </span>
            </div>
        )
    }

    return (
        <Form onFinish={handleSubmit} layout="vertical" style={{ gap: token.marginLG }}>
            {/* Step 1: Language Selection */}
            <LanguageSelectionSection
                formData={formData}
                onInputChange={handleInputChange}
                getFieldError={getFieldError}
            />

            {/* Step 2: Deck Type Selection */}
            <DeckTypeSection
                formData={formData}
                defaultDecks={defaultDecks}
                onInputChange={handleInputChange}
                getFieldError={getFieldError}
            />

            {/* Step 3: Content Input */}
            <ContentInputSection
                formData={formData}
                deckMode={deckMode}
                onInputChange={handleInputChange}
                getFieldError={getFieldError}
            />

            {/* Step 4: Card Direction */}
            <CardDirectionSection
                formData={formData}
                onInputChange={handleInputChange}
            />

            {/* Step 5: Model & AI Settings */}
            <ModelSettingsSection
                formData={formData}
                onInputChange={handleInputChange}
                getFieldError={getFieldError}
            />

            {/* Error Display */}
            {error && (
                <Alert
                    message="Error"
                    description={error}
                    type="error"
                    icon={<ExclamationCircleOutlined />}
                    showIcon
                    style={{ marginBottom: token.marginMD }}
                />
            )}

            {/* Test Result Display */}
            {testResult && (
                <Alert
                    message={testResult.includes('✅') ? 'Configuration Valid' : 'Configuration Error'}
                    description={testResult}
                    type={testResult.includes('✅') ? 'success' : 'error'}
                    showIcon
                    style={{ marginBottom: token.marginMD }}
                />
            )}

            {/* Action Buttons */}
            <Space.Compact
                direction="vertical"
                style={{ width: '100%' }}
                size="middle"
            >
                <Space
                    direction="horizontal"
                    style={{ width: '100%', flexWrap: 'wrap' }}
                    size="middle"
                >
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isGenerating}
                        disabled={isTesting}
                        icon={isGenerating ? <LoadingOutlined /> : <DownloadOutlined />}
                        size="large"
                        style={{ flex: 1, minWidth: '200px' }}
                    >
                        {isGenerating ? 'Generating Deck...' : 'Generate Deck'}
                    </Button>

                    <Button
                        type="default"
                        onClick={handleTestConfiguration}
                        loading={isTesting}
                        disabled={isGenerating}
                        size="large"
                        style={{
                            backgroundColor: token.colorSuccess,
                            borderColor: token.colorSuccess,
                            color: 'white'
                        }}
                    >
                        {isTesting ? 'Testing...' : 'Test Configuration'}
                    </Button>

                    <Button
                        type="default"
                        onClick={handleClearStoredData}
                        disabled={isGenerating || isTesting}
                        size="large"
                    >
                        Clear Data
                    </Button>
                </Space>
            </Space.Compact>

            {/* Validation Errors Summary */}
            {errors.length > 0 && (
                <Alert
                    message="Please fix the following errors:"
                    description={
                        <ul style={{ margin: 0, paddingLeft: token.paddingMD }}>
                            {errors.map((error, index) => (
                                <li key={index} style={{ fontSize: token.fontSizeSM }}>
                                    {error.message}
                                </li>
                            ))}
                        </ul>
                    }
                    type="warning"
                    showIcon
                    style={{ marginTop: token.marginMD }}
                />
            )}
        </Form>
    )
} 