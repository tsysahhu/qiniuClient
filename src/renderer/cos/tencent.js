import cosUtil from 'cos-nodejs-sdk-v5/sdk/util';

cosUtil.isBrowser = false;
import tencent from 'cos-nodejs-sdk-v5';
import TencentBucket from "@/cos/tencentBucket";

let cos = null;

function init(param) {
    cos = new tencent({
        SecretId: param.access_key,
        SecretKey: param.secret_key,
    });
}

function getBuckets(callback) {
    cos.getService(function (err, data) {
        let error = null;
        if (err) {
            error = {};
            error.message = err.error.Message;
            callback(error);
        } else {
            data.Buckets.forEach((item, index) => {
                data.Buckets[index].name = item.Name;
            });
            callback && callback(null, {datas: data.Buckets});
        }
    });
}

/**
 * 批量修改文件名
 * @param bucket    名称
 * @param items     需要处理的文件
 * @param replace   需要处理的文件
 * @param callback
 */
function rename(params, items, callback) {
    if (!Array.isArray(items)) {
        items = [items];
    }

    let files = [];

    let changeName = function (item) {
        params.Key = item._key;
        params.CopySource = params.Bucket + '.cos.' + params.Region + '.myqcloud.com/' + encodeURIComponent(item.key).replace(/%2F/g, '/');

        cos.sliceCopyFile(params, (error, data) => {
            console.log(error, data);
            if (!error) {
                files.push(item);
            }
            index++;
            if (index !== items.length) {
                changeName(items[index]);
            } else {
                remove(params, files, callback);
            }
        });
    };


    let index = 0;
    changeName(items[index]);
}

/**
 * 批量删除文件
 * @param params    bucket信息
 * @param items     需要处理的文件
 * @param callback
 */
function remove(params, items, callback) {
    if (!Array.isArray(items)) {
        items = [items];
    }
    params.Objects = [];
    items.forEach((item) => {
        params.Objects.push({Key: item.key});
    });

    cos.deleteMultipleObject(params, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            callback && callback(data);
        }
    });
}

function generateBucket(name) {
    return new TencentBucket(name, cos);
}

export {init, getBuckets, generateBucket, remove, rename};
