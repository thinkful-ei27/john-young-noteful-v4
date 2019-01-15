/* global $, store */
'use strict';

const api = (function () {
  const search = function (path, query) {
    return $.ajax({
      type: 'GET',
      url: path,
      dataType: 'json',
      headers: { 'Authorization': `Bearer ${store.authToken}`},
      data: query
    });
  };
  const details = function (path) {
    return $.ajax({
      type: 'GET',
      dataType: 'json',
      headers: { 'Authorization': `Bearer ${store.authToken}`},
      url: path
    });
  };
  const update = function (path, obj) {
    return $.ajax({
      type: 'PUT',
      url: path,
      contentType: 'application/json',
      dataType: 'json',
      headers: { 'Authorization': `Bearer ${store.authToken}`},
      data: JSON.stringify(obj)
    });
  };
  const create = function (path, obj) {
    return $.ajax({
      type: 'POST',
      url: path,
      contentType: 'application/json',
      dataType: 'json',
      processData: false,
      headers: { 'Authorization': `Bearer ${store.authToken}`},
      data: JSON.stringify(obj)
    });
  };
  const remove = function (path) {
    return $.ajax({
      type: 'DELETE',
      dataType: 'json',
      headers: { 'Authorization': `Bearer ${store.authToken}`},
      url: path
    });
  };
  return {
    create,
    search,
    details,
    update,
    remove
  };
}());