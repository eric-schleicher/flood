/*global require*/
'use strict';

require.config({
    shim: {
        underscore: {
            exports: '_'
        },
        backbone: {
            deps: [
                'underscore',
                'jquery'
            ],
            exports: 'Backbone'
        },
        List: {
            deps: [
                'jquery'
            ],
            exports: 'List'
        },
        Three: {
            exports: 'Three'
        },
        CSG: {
            exports: 'CSG'
        },
        FLOODCSG: {
            deps: ['CSG'],
            exports: 'FLOODCSG'
        },
        CopyShader: {
            deps: [
                'Three'
            ],
            exports: 'CopyShader'
        },
        HorizontalBlurShader: {
            deps: [
                'Three'
            ],
            exports: 'HorizontalBlurShader'
        },
        VerticalBlurShader: {
            deps: [
                'Three'
            ],
            exports: 'VerticalBlurShader'
        },
        EffectComposer: {
            deps: [
                'Three',
                'CopyShader'
            ],
            exports: 'EffectComposer'
        },
        RenderPass: {
            deps: [
                'Three'
            ],
            exports: 'RenderPass'
        },
        MaskPass: {
            deps: [
                'Three'
            ],
            exports: 'MaskPass'
        },
        ShaderPass: {
            deps: [
                'Three'
            ],
            exports: 'ShaderPass'
        },
        Viewport: {
            deps: [
                'Three',

                'CopyShader',
                'HorizontalBlurShader',
                'VerticalBlurShader',
                'EffectComposer',
                'RenderPass',
                'MaskPass',
                'ShaderPass',
                'OrbitControls'
            ],
            exports: 'Viewport'
        },
        OrbitControls: {
            deps: [
                'Three'
            ],
            exports: 'OrbitControls'
        },
        jqueryuislider: {
            deps: [
                'jquery',
                'jqueryuimouse',
                'jqueryuicore',
                'jqueryuiwidget'
            ],
            exports: 'jqueryuislider'
        },
        jqueryuidraggable: {
            deps: [
                'jquery',
                'jqueryuimouse',
                'jqueryuicore',
                'jqueryuiwidget'
            ],
            exports: 'jqueryuidraggable'
        },
        jqueryuimouse: {
            deps: [
                'jquery',
                'jqueryuiwidget'
            ],
            exports: 'jqueryuimouse'
        },
        jqueryuicore: {
            deps: [
                'jquery'
            ],
            exports: 'jqueryuicore'
        },
        jqueryuiwidget: {
            deps: [
                'jquery'
            ],
            exports: 'jqueryuiwidget'
        },
        bootstrap: {
            deps: [
                'jquery'
            ],
            exports: 'bootstrap'
        },
        almond: {
            deps: [
            ],
            exports: 'almond'
        }
    },
    paths: {

        // backbone collections
        Connections: 'collections/Connections',
        SearchElements: 'collections/SearchElements',
        Nodes: 'collections/Nodes',
        Workspaces: 'collections/Workspaces',
        WorkspaceBrowserElements: 'collections/WorkspaceBrowserElements',

        // backbone models
        App: 'models/App',
        Connection: 'models/Connection',
        Marquee: 'models/Marquee',
        Node: 'models/Node',
        Search: 'models/Search',
        SearchElement: 'models/SearchElement',
        Workspace: 'models/Workspace',
        Runner: 'models/Runner',
        Help: 'models/Help',
        Feedback: 'models/Feedback',
        Login: 'models/Login',
        WorkspaceBrowserElement: 'models/WorkspaceBrowserElement',
        WorkspaceBrowser: 'models/WorkspaceBrowser',
        WorkspaceResolver: 'models/WorkspaceResolver',

        // backbone views
        AppView: 'views/AppView',
        ConnectionView: 'views/ConnectionView',
        MarqueeView: 'views/MarqueeView',
        SearchView: 'views/SearchView',
        WorkspaceControlsView: 'views/WorkspaceControlsView',
        SearchElementView: 'views/SearchElementView',
        WorkspaceView: 'views/WorkspaceView',
        WorkspaceTabView: 'views/WorkspaceTabView',
        HelpView: 'views/HelpView',
        FeedbackView: 'views/FeedbackView',
        LoginView: 'views/LoginView',
        WorkspaceBrowserElementView: 'views/WorkspaceBrowserElementView',
        WorkspaceBrowserView: 'views/WorkspaceBrowserView',
        
        // node backbone views
        NodeViewTypes: 'views/NodeViews/NodeViews',
        BaseNodeView: 'views/NodeViews/Base',
        WatchNodeView: 'views/NodeViews/Watch',
        NumNodeView: 'views/NodeViews/Num',
        FormulaView: 'views/NodeViews/Formula',
        InputView: 'views/NodeViews/Input',
        OutputView: 'views/NodeViews/Output',
        CustomNodeView: 'views/NodeViews/CustomNode',

        ThreeCSGNodeView: 'views/NodeViews/ThreeCSG',

        CopyShader: 'lib/Three/CopyShader',
        HorizontalBlurShader: 'lib/Three/HorizontalBlurShader',
        VerticalBlurShader: 'lib/Three/VerticalBlurShader',
        EffectComposer: 'lib/Three/EffectComposer',
        RenderPass: 'lib/Three/RenderPass',
        MaskPass: 'lib/Three/MaskPass',
        ShaderPass: 'lib/Three/ShaderPass',

        OrbitControls: 'lib/OrbitControls',
        Viewport: 'lib/Viewport',
        FLOODCSG: 'lib/flood/flood_csg',
        FLOOD: 'lib/flood/flood',
        CSG: 'lib/flood/csg',
        scheme: 'lib/flood/scheme',

        // bower
        almond: '../bower_components/almond/almond',
        bootstrap: '../bower_components/bootstrap/dist/js/bootstrap',
        List: '../bower_components/listjs/dist/list.min',
        Three: '../bower_components/threejs/build/three.min',
        jqueryuislider: '../bower_components/jquery.ui/ui/jquery.ui.slider',
        jqueryuidraggable: '../bower_components/jquery.ui/ui/jquery.ui.draggable',
        jqueryuicore: '../bower_components/jquery.ui/ui/jquery.ui.core',
        jqueryuimouse: '../bower_components/jquery.ui/ui/jquery.ui.mouse',
        jqueryuiwidget: '../bower_components/jquery.ui/ui/jquery.ui.widget',
        jquery: '../bower_components/jquery/jquery',
        backbone: '../bower_components/backbone-amd/backbone',
        underscore: '../bower_components/underscore-amd/underscore',
    }

});



