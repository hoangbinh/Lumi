import express from 'express';
import { H5PEditor, H5PPlayer } from '@lumieducation/h5p-server';
import h5pAjaxExpressRouter from '@lumieducation/h5p-server/build/src/adapters/H5PAjaxRouter/H5PAjaxExpressRouter';
import libraryAdministrationExpressRouter from '@lumieducation/h5p-server/build/src/adapters/LibraryAdministrationRouter/LibraryAdministrationExpressRouter';
import contentTypeCacheExpressRouter from '@lumieducation/h5p-server/build/src/adapters/ContentTypeCacheRouter/ContentTypeCacheExpressRouter';

// import h5pConfig from '../../config/h5pConfig';
import lumiRoutes from './lumiRoutes';
import trackingRoutes from './trackingRoutes';
import Logger from '../helpers/Logger';
import IServerConfig from '../IServerConfig';
import h5pRoutes from './h5pRoutes';

import User from '../User';

const log = new Logger('routes');

export default function (
    h5pEditor: H5PEditor,
    h5pPlayer: H5PPlayer,
    serverConfig: IServerConfig
): express.Router {
    const router = express.Router();

    log.info('setting up routes');

    router.use('/api/v1/track', trackingRoutes());

    // Adding dummy user to make sure all requests can be handled
    router.use((req, res, next) => {
        (req as any).user = new User();
        next();
    });

    // // Directly serving the library and content files statically speeds up
    // // loading times and there is no security issue, as Lumi never is a
    // // multi-user environment.
    // router.use(
    //     h5pConfig.baseUrl + h5pConfig.contentFilesUrl,
    //     express.static(`${serverConfig.workingCachePath}`)
    // );
    // router.use(
    //     h5pConfig.baseUrl + h5pConfig.librariesUrl,
    //     express.static(`${serverConfig.librariesPath}`)
    // );

    // The Express adapter handles GET and POST requests to various H5P
    // endpoints. You can add an options object as a last parameter to configure
    // which endpoints you want to use. In this case we don't pass an options
    // object, which means we get all of them.
    router.use(
        h5pEditor.config.baseUrl,
        h5pAjaxExpressRouter(
            h5pEditor,
            `${__dirname}/../../../h5p/core`, // the path on the local disc where the files of the JavaScript client of the player are stored
            `${__dirname}/../../../h5p/editor`, // the path on the local disc where the files of the JavaScript client of the editor are stored
            undefined,
            'auto' // You can change the language of the editor here by setting
            // the language code you need here. 'auto' means the route will try
            // to use the language detected by the i18next language detector.
        )
    );

    // The expressRoutes are routes that create pages for these actions:
    // - Creating new content
    // - Editing content
    // - Saving content
    // - Deleting content
    router.use(
        h5pEditor.config.baseUrl,
        h5pRoutes(
            h5pEditor,
            h5pPlayer,
            'auto' // You can change the language of the editor here by setting
            // the language code you need here. 'auto' means the route will try
            // to use the language detected by the i18next language detector.
        )
    );

    // The LibraryAdministrationExpress routes are REST endpoints that offer library
    // management functionality.
    router.use(
        `${h5pEditor.config.baseUrl}/libraries`,
        libraryAdministrationExpressRouter(h5pEditor)
    );

    // The ContentTypeCacheExpress routes are REST endpoints that allow updating
    // the content type cache manually.
    router.use(
        `${h5pEditor.config.baseUrl}/content-type-cache`,
        contentTypeCacheExpressRouter(h5pEditor.contentTypeCache)
    );

    router.use('/api/v1/lumi', lumiRoutes(h5pEditor));

    router.get('*', express.static(`${__dirname}/../../client`));

    return router;
}
