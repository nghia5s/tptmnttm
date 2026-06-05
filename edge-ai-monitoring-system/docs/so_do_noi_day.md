# So do noi day cac module

## Danh sach module

- Arduino Uno/Nano hoac board tuong thich Arduino.
- Cam bien anh sang LDR/module LDR.
- Cam bien am thanh analog.
- Cam bien nhiet do/do am DHT11 hoac DHT22.
- Cam bien nuoc mua analog.

## Bang dau noi

| Module | Chan module | Noi vao Arduino | Ghi chu |
| --- | --- | --- | --- |
| DHT11/DHT22 | `+` | 5V | Nguon |
| DHT11/DHT22 | `OUT` | D2 | Tin hieu nhiet do va do am |
| DHT11/DHT22 | `-` | GND | Noi chung mass |
| Cam bien nuoc mua | `-` | GND | Noi chung mass |
| Cam bien nuoc mua | `+` | 5V | Nguon |
| Cam bien nuoc mua | `S` | A2 | Tin hieu muc uot/mua |
| Cam bien anh sang | `DO` | D3 | Tin hieu digital sang/toi |
| Cam bien anh sang | `GND` | GND | Noi chung mass |
| Cam bien anh sang | `VCC` | 5V | Nguon |
| Cam bien am thanh | `DO` | Khong noi | Code dung tin hieu analog |
| Cam bien am thanh | `+` | 5V | Nguon |
| Cam bien am thanh | `G` | GND | Noi chung mass |
| Cam bien am thanh | `A0` | A1 | Tin hieu am thanh analog |

Neu dung cam bien DHT dang linh kien roi, nen co dien tro keo len 10k ohm giua chan `DATA` va `VCC`. Neu dung module DHT 3 chan, thuong module da co san dien tro nay.

## So do tong quan

```text
                         +------------------+
                         |     Arduino      |
                         |                  |
Light VCC ------------- | 5V               |
Light GND ------------- | GND              |
Light DO  ------------- | D3               |
                         |                  |
Sound VCC ------------- | 5V               |
Sound GND ------------- | GND              |
Sound AO  ------------- | A1               |
                         |                  |
Rain GND  ------------- | GND              |
Rain VCC  ------------- | 5V               |
Rain S    ------------- | A2               |
                         |                  |
DHT +     ------------- | 5V               |
DHT -     ------------- | GND              |
DHT OUT   ------------- | D2               |
                         +------------------+
```

## Luu y

- Tat ca module phai noi chung `GND`.
- Sketch dang dung baudrate `9600`.
- Neu dung DHT22, doi trong firmware:

```cpp
#define DHT_TYPE DHT22
```

- Cam bien anh sang cua ban chi co `DO`, nen firmware dang doc theo dang digital tai `D3`. Gia tri anh sang tren dashboard se la 0% hoac 100%, khong min nhu cam bien co `AO`.
- Neu cam bien anh sang bao nguoc sang/toi, doi logic trong ham `readLightPercent()`.
- Firmware mac dinh doc cam bien mua theo huong `S` cao = uot/mua nhieu. Neu dashboard bao nguoc, doi `RAIN_SENSOR_WET_LOW` trong firmware.
