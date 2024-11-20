from firebase_admin import db
from firebase_functions import https_fn, options
from firebase_admin import initialize_app, storage
from werkzeug.utils import secure_filename
from datetime import datetime
import json
import os
import logging

logger = logging.getLogger('cloudfunctions.googleapis.com%2Fcloud-functions')
logger.setLevel(logging.INFO)
logger.addHandler(logging.StreamHandler())

initialize_app()

@https_fn.on_request(
    # region='asia-south1',
    cors=options.CorsOptions(
        cors_origins="*",
        cors_methods=["post"]))
def upload_video(req: https_fn.Request) -> https_fn.Response:
    # This is a test function for Alder

    if req.method != "POST":
        return https_fn.Response(json.dumps({"response": "Invalid request type, only POST requests are allowed"}), mimetype="application/json", status=405)
    try:
        content_type = req.headers.get('Content-Type', '')
    except:
        return https_fn.Response("Invalid content type in the request", status=500)

    if 'multipart/form-data' in content_type:
        try:
            if 'moderator' not in req.form:
                return https_fn.Response(json.dumps({
                    "result": 2,
                    "error": "Moderator is missing"
                }), mimetype="application/json", status=500)
            
            ALLOWED_EXTENSIONS = {'.mov'}

            video = next(iter(req.files.values()))
            filename, fileExtension = os.path.splitext(secure_filename(video.filename))

            # video = req.files['video']
            # filename, fileExtension = os.path.splitext(secure_filename(req.files['video'].filename))

            if fileExtension not in ALLOWED_EXTENSIONS:
                return https_fn.Response(json.dumps({
                    "result": 2,
                    "error": "The file must be a .mov file"
                }), mimetype="application/json", status=500)

            video_binary = video.read()

            new_file_name = str(db.reference('lastVideoId').transaction(lambda x: x+1 if x is not None else 10000))

            file_path = 'videos/' + new_file_name + fileExtension
            bucket = storage.bucket()
            blob = bucket.blob(file_path)
            blob.upload_from_string(video_binary, content_type='video/quicktime')
            
            date = int(datetime.now().strftime("%Y%m%d%H%M%S"))
            
            moderator = int(req.form.get('moderator', None))
            
            # db.reference('videos/'+ moderator).set({'date':date})
            # db.reference('videos/' + str(moderator)).push({new_file_name: {'date':date}})
            db.reference('videos/' + str(moderator)).child(new_file_name).set({'date': date})
            

            return https_fn.Response(json.dumps({'uploadIsDone':True}), mimetype="application/json", status=200)

        except Exception as e:
            logger.log(msg='Internal error: ' + str(e), level=logging.INFO)
            return https_fn.Response(json.dumps({"error": str(e)}), mimetype="application/json", status=400)

    #This return will execute if the request failed
    return https_fn.Response("internal error", status=500)