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
          // Copy manifest (browser-specific)
          {
            from: browser === 'safari' ? 'platforms/safari/manifest.json' : 'manifest.json',
            to: 'manifest.json',
            transform(content) {
              const manifest = JSON.parse(content.toString());
              
              // Browser-specific modifications
              if (browser === 'firefox') {
                // Firefox uses manifest v2
                manifest.manifest_version = 2;
                manifest.browser_action = manifest.action;
                delete manifest.action;
                manifest.background = {
                  scripts: ['js/background.js'],
                  persistent: false
                };
              } else if (browser === 'safari') {
                // Safari uses manifest v2
                manifest.manifest_version = 2;
                manifest.browser_action = manifest.action;
                delete manifest.action;
                manifest.background = {
                  scripts: ['js/background.js'],
                  persistent: false
                };
              }
              
              return JSON.stringify(manifest, null, 2);
            }
          },
          
          // Copy popup files
          {
            from: 'src/popup/popup.html',
            to: 'popup/popup.html'
          },
          {
            from: 'src/popup/popup.css',
            to: 'popup/popup.css'
          },
          
          // Copy options files
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
          
          // Copy icons (placeholder - will be created later)
          {
            from: 'images',
            to: 'images',
            noErrorOnMissing: true
          }
        ]
      })
    ],
    
    devtool: isProduction ? false : 'source-map',
    
    optimization: {
      minimize: isProduction
    }
  };
};
