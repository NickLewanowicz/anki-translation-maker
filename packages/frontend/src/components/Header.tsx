import { Languages } from 'lucide-react'
import { Layout, Space, Typography, theme } from 'antd'
import { ThemeToggle } from './ThemeToggle'

const { Header: AntHeader } = Layout
const { Title } = Typography

export function Header() {
    const { token } = theme.useToken()

    return (
        <AntHeader
            style={{
                background: token.colorBgContainer,
                borderBottom: `1px solid ${token.colorBorder}`,
                padding: '0 24px',
                height: 'auto',
                lineHeight: 'normal',
                display: 'flex',
                alignItems: 'center',
                minHeight: '64px'
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <Space size="middle" align="center">
                    <Languages
                        size={32}
                        style={{ color: token.colorPrimary }}
                    />
                    <Title
                        level={3}
                        style={{
                            margin: 0,
                            color: token.colorText,
                            fontWeight: 600
                        }}
                    >
                        Anki Translation Maker
                    </Title>
                </Space>
                <ThemeToggle />
            </div>
        </AntHeader>
    )
} 