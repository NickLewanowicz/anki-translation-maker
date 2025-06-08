import { Layout, Typography, theme } from 'antd'

const { Footer: AntFooter } = Layout
const { Text, Link } = Typography

export function Footer() {
    const { token } = theme.useToken()

    return (
        <AntFooter
            style={{
                background: token.colorBgLayout,
                borderTop: `1px solid ${token.colorBorder}`,
                textAlign: 'center',
                padding: '24px'
            }}
        >
            <Text style={{ color: token.colorTextSecondary }}>
                Built with{' '}
                <Link
                    href="https://replicate.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: token.colorPrimary }}
                >
                    Replicate
                </Link>{' '}
                and{' '}
                <Link
                    href="https://ankiweb.net"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: token.colorPrimary }}
                >
                    Anki
                </Link>
            </Text>
        </AntFooter>
    )
} 