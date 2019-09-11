'use strict';

const elasticsearch = require('elasticsearch');
const { merge } = require('lodash');
const client = new elasticsearch.Client();

const coOpenAccess = {};
coOpenAccess.doTheJob = function (docObject, next) {
  if (!docObject.hasDoi) return next(null, docObject);

  client.search({
    q: `doi:"${docObject.doi}"`,
    index: 'unpaywall'
  }).then(response => {
    const hasZeroOrManyResult = response.hits.total !== 1;
    if (hasZeroOrManyResult) return next(null, docObject);
    const result = response.hits.hits.pop()._source;
    const enrichment = {
      isOa: result.is_oa,
      isJournalIsOa: result.journal_is_oa,
      journalIsInDoaj: result.journal_is_in_doaj,
      oaStatus: result.oa_status,
      bestOaLocation: result.best_oa_location,
      oaLocations: result.oa_locations
    };
    docObject = merge(enrichment, docObject);
    next(null, docObject);
  }).catch(next);
};

module.exports = coOpenAccess;
