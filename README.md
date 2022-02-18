# odrabiamy-bot
odrabiamy-bot to Discordowy klient serwisu odrabiamy.pl

na bazie [doteq/odrabiamy-bot](https://github.com/doteq/odrabiamy-bot)

## Użycie
Skonfiguruj bota w pliku [`src/config.ts`](src/config.ts) i uruchom:
```bash
$ npm install
$ npm run build
$ node ./dist/main.js
```
Po poprawnym skonfigurowaniu i uruchomieniu bota wystarczy wysłać adres url zadania na kanał podany wcześniej w pliku config, a bot odeśle pełne rozwiązanie. Możesz też napisać ``!str`` przed adresem url żeby bot odesłał rozwiązania z całej strony oraz ``!split`` żeby wysłać każdy podpunkt osobno.

## Ostrzeżenie
Korzystanie z API serwisu odrabiamy.pl przez zewnętrzne programy jest możliwe wyłącznie za zgodą administracji. Użytkownik bierze na siebie całą odpowiedzialność przy korzystaniu z projektu.
