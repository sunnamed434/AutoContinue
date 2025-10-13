const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const browser = env.browser || 'chrome';

  return {
    entry: {
      background: './src/background.ts',
      content: './src/content.ts',
      autoconfirm: './src/autoconfirm-simple.ts',
      popup: './src/popup/popup.ts',
      options: './src/options/options.ts'
    },
    
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'js/[name].js',
      clean: true
    },
    
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          },
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    
    resolve: {
      extensions: ['.ts', '.js']
    },
    
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: browser === 'safari' ? 'platforms/safari/manifest.json' : 'manifest.json',
            to: 'manifest.json',
            transform(content) {
              const manifest = JSON.parse(content.toString());
              
              manifest.content_security_policy = {
                extension_pages: "script-src 'self'; object-src 'self';"
              };
              
              if (browser === 'firefox') {
                manifest.manifest_version = 2;
                manifest.browser_action = manifest.action;
                delete manifest.action;
                manifest.background = {
                  scripts: ['js/background.js'],
                  persistent: false
                };
                manifest.content_security_policy = "script-src 'self'; object-src 'self';";
              } else if (browser === 'safari') {
                manifest.manifest_version = 2;
                manifest.browser_action = manifest.action;
                delete manifest.action;
                manifest.background = {
                  scripts: ['js/background.js'],
                  persistent: false
                };
                manifest.content_security_policy = "script-src 'self'; object-src 'self';";
              } else if (browser === 'edge') {
                // Edge uses same manifest as Chrome (Manifest V3)
                // No changes needed
              }
              
              return JSON.stringify(manifest, null, 2);
            }
          },
          
          {
            from: 'src/popup/popup.html',
            to: 'popup/popup.html'
          },
          {
            from: 'src/popup/popup.css',
            to: 'popup/popup.css'
          },
          
          {
            from: 'src/options/options.html',
            to: 'options/options.html'
          },
          {
            from: 'src/options/options.css',
            to: 'options/options.css'
          },
          
          // Copy locales
          {
            from: '_locales',
            to: '_locales'
          },
          
          // Copy only essential icons
          {
            from: 'images/icon16.png',
            to: 'images/icon16.png',
            noErrorOnMissing: true
          },
          {
            from: 'images/icon32.png',
            to: 'images/icon32.png',
            noErrorOnMissing: true
          },
          {
            from: 'images/icon48.png',
            to: 'images/icon48.png',
            noErrorOnMissing: true
          },
          {
            from: 'images/icon128.png',
            to: 'images/icon128.png',
            noErrorOnMissing: true
          },
          
          // Copy Safari-specific files
          ...(browser === 'safari' ? [
            {
              from: 'platforms/safari/manifest.json',
              to: 'manifest.json'
            },
            {
              from: 'platforms/safari/Info.plist',
              to: 'Info.plist'
            }
          ] : [])
        ]
      })
    ],
    
    devtool: isProduction ? false : 'source-map',
    
    optimization: {
      minimize: isProduction,
    },
    performance: {
      maxAssetSize: 250000,
      maxEntrypointSize: 250000,
      hints: isProduction ? 'warning' : false,
    }
  };
};
