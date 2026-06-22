# TimesFM API

Webドックの「AI需要予測」画面から呼び出すPython APIです。

## ローカル起動

Python 3.12を推奨します。

```bash
cd services/timesfm-api
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

初回予測時にTimesFM 2.5モデル（約925MB）をダウンロードします。

## Docker

```bash
docker build -t webdock-timesfm .
docker run --rm -p 8000:8000 \
  -e TIMESFM_API_KEY=change-me \
  -v timesfm-cache:/data/huggingface \
  webdock-timesfm
```

## 環境変数

- `TIMESFM_API_KEY`: 任意。設定するとBearer認証が有効になります。
- `TIMESFM_MODEL_ID`: デフォルトは `google/timesfm-2.5-200m-pytorch`
- `TIMESFM_MAX_CONTEXT`: デフォルト15,000（予測枠とモデル内部上限を共有）
- `TIMESFM_MAX_HORIZON`: デフォルト1,000

CPUでも動作しますが、本番ではメモリ4GB以上の常駐コンテナを推奨します。
