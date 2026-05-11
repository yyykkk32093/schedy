
[1]DB名そのものも変えたい。resrve_manageになっているのでtsunacaにする。

[2]DBのスキーマを分ける。
master系 , domainの観点か？

[3]DBの命名マスターテーブルなのに、XX Masterという命名じゃないものの命名

[4]テーブル名をpostgre慣習に合わせて変更したい。

[5]CommunityWebhookConfigって使ってんの？他にも利用していないテーブルがあるなら綺麗にしたい。

[6]BEのDDDになっていないもの
routerとかUsecaseで直接prisma叩いてるやつがおる
利用していないAPI・Usecaseがないか確認

[7]DB:INDEX付与状況確認

[8]BEのディレクトリ構成を評価/見直し

[9]BEのRestFul評価