Создать контейнер
```
sudo docker-compose build
```


Запустить контейнер
```bash
sudo docker-compose up
```


Список запущенных контейнеров
```
sudo docker-compose ps
```


Запустить bash в контейнере
```
sudo docker exec -it {container name} /bin/bash
```


Следить за изменениями в файлах и собирать проект
```
gulp dev
```


Собрать проект
```
gulp build
```


Собрать проект для production
```
gulp build --env production
```
