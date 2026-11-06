# Auditoria Lighthouse (mediana de 3 medições)

| Página | Perfil | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| inicio | mobile | **68** ⚠️ | 100 | 100 | 100 | 4551 ms | 0.000 | 615 ms |
| inicio | desktop | 99 | 100 | 100 | 100 | 1025 ms | 0.001 | 22 ms |
| detalhe | mobile | **72** ⚠️ | 100 | 100 | 100 | 4575 ms | 0.000 | 476 ms |
| detalhe | desktop | 98 | 100 | 100 | 100 | 1083 ms | 0.031 | 2 ms |

## Ambiente

- **date**: 2026-11-06T06:15:40.347Z
- **url**: http://localhost:4180
- **lighthouse**: 13.6.0
- **chrome**: Chrome/153.0.0.0
- **node**: v22.23.4
- **os**: Linux 6.18.44-fc-v242 (x64)
- **cpus**: 2
- **runsPerPage**: 3
- **conditions**: Build de produção (vite build + vite preview) com os mocks ligados e o cenário padrão. Mobile: throttling simulado padrão do Lighthouse (4x CPU, rede 4G lenta). Desktop: preset desktop do Lighthouse.
