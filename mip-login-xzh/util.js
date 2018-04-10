/**
 * @file 常用方法
 * @author xuexb <fe.xiaowu@gmail.com>
 */

define(function (require) {
    'use strict';

    var parseCacheUrl = require('util').parseCacheUrl;
    var extend = require('util').fn.extend;

    /**
     * 熊掌号授权链接
     *
     * @type {string}
     */
    var OAUTH_URL = 'https://openapi.baidu.com/oauth/2.0/authorize?'
        + 'response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}&scope=snsapi_userinfo&state=${state}';

    var util = {};

    /**
     * 处理字符串query
     *
     * @type {Object}
     */
    util.querystring = {

        /**
         * 解析对象为 string
         *
         * @param  {Object} data 一级对象数据
         * @return {string}
         */
        stringify: function (data) {
            return Object.keys(data).map(function (key) {
                return encodeURIComponent(key) + '=' + encodeURIComponent(data[key] || '');
            }).join('&');
        }
    };

    /**
     * 获取链接中的 query
     *
     * @param  {string} name 参数名称
     * @return {string}
     */
    util.getQuery = function (name) {
        var url = location.search.substr(1);
        var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
        var matched = url.match(reg);

        return matched ? decodeURIComponent(matched[2]) : '';
    };

    /**
     * 获取授权登录链接
     *
     * @param  {Object} data 配置数据
     *
     * @return {string}
     */
    util.getOauthUrl = function (data) {
        return OAUTH_URL.replace(/\$\{([^\}]+)\}/g, function (matched, key) {
            return data.hasOwnProperty(key) ? data[key] : '';
        });
    };

    /**
     * 获取当前原始页面链接
     *
     * @description 会做如下处理：
     *              1. 删除 hash 后面的字符，因为透传有问题
     *              2. 删除 code state 参数，防止多次重定向链接越来越长
     * @return {string}
     */
    util.getSourceUrl = function () {
        return parseCacheUrl(location.href)
            .replace(/#.*$/, '')
            .replace(/([&?])((code|state)=[^&$]+)/g, function (matched, prefix) {
                return prefix === '?' ? '?': '';
            });
    };

    /**
     * 小小的封装下 ls < cokie
     *
     * @type {Object}
     */
    util.store = {

        /**
         * 检查是否支持 ls
         *
         * @type {boolean}
         */
        support: function () {
            var support = true;
            try {
                window.localStorage.setItem('lsExisted', '1');
                window.localStorage.removeItem('lsExisted');
            } catch (e) {
                support = false;
            }
            return support;
        }(),

        /**
         * 获取缓存数据
         *
         * @param  {string} key 数据名称
         * @return {string}
         */
        get: function (key) {
            if (util.store.support) {
                return localStorage.getItem(key);
            }

            if (document.cookie.match(new RegExp('(^| )' + encodeURIComponent(key) + '=([^;]*)(;|$)')) !== null) {
                return decodeURIComponent(RegExp.$2);
            }

            return '';
        },

        /**
         * 设置缓存数据
         *
         * @param {string} key   数据名称
         * @param {string} value 数据值
         * @param {UTC} expires 过期时间
         * @return {string}
         */
        set: function (key, value, expires) {
            if (util.store.support) {
                return localStorage.setItem(key, value);
            }

            var arr = [];

            arr.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
            arr.push('path=/');

            if (expires) {
                arr.push('expires=' + expires);
            }

            document.cookie = arr.join(';');
        },

        /**
         * 删除缓存数据
         *
         * @param  {string} key 数据名称
         * @return {string}
         */
        remove: function (key) {
            if (util.store.support) {
                return localStorage.removeItem(key);
            }

            var date = new Date();
            date.setTime(date.getTime() - 100);

            return util.store.set(key, 'null', date.toUTCString());
        }
    };

    /**
     * 发送 POST 请求
     *
     * @param  {string} url  接口链接
     * @param  {Object} data  发送数据
     *
     * @return {Promise}
     */
    util.post = function (url, data) {
        return fetch(url, {
            method: 'post',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: util.querystring.stringify(extend({}, data || {}, {
                accessToken: util.store.get(url)
            })),
            credentials: 'include'
        }).then(function (res) {
            return res.json();
        });
    };

    return util;
});
