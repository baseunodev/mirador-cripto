# Metodología y fuentes de datos

| Dato | Fuente | Actualización |
|---|---|---|
| Precios, capitalización y gráficos de criptomonedas | [CoinGecko](https://www.coingecko.com) | Cada 15 minutos (gráficos cada 12 horas) |
| Precio del USDT en cada país | [CriptoYa](https://criptoya.com) (exchanges y P2P) | Cada 10 minutos |
| Dólar oficial, blue, MEP y CCL en Argentina | [DolarApi](https://dolarapi.com) | Cada 10 minutos |
| Tipos de cambio oficiales de otros países | [ExchangeRate-API](https://www.exchangerate-api.com) | Cada 30 minutos |
| Índice de miedo y codicia | [Alternative.me](https://alternative.me/crypto/fear-and-greed-index/) | Diario |

## Cómo calculamos el dólar cripto

Tomamos el precio de compra y de venta de 1 USDT en cada plataforma, con comisiones incluidas, y mostramos la **mediana**. Usamos la mediana y no el promedio para que una plataforma con un precio raro no distorsione el número.

## Conversiones a moneda local

En países con brecha cambiaria (Argentina, Venezuela y otros de América Latina) convertimos con el **tipo de cambio cripto** (precio del USDT), porque es el que paga de verdad quien compra o vende cripto. En dólares y euros usamos el tipo de cambio oficial. Cada página indica cuál se usó.

## Limitaciones

Los precios son de referencia y pueden diferir de los de cada plataforma por comisiones, demoras o diferencias de liquidez. No los uses como único dato para operar.
