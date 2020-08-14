module.exports = {
    // 入口文件
    entry: {
        main: './main.js'
    },

    module: {
        // 配置规则
        rules: [
            {
                // 所有以.js结尾的都应用babel-loader
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    // babel-loader 通过options配置
                    // 用 presets 来指定 babel-loader 的配置
                    options: {
                        // presets: 理解为一系列Babel的 config 的一种快捷方式
                        presets: ['@babel/preset-env'],
                        plugins: [['@babel/plugin-transform-react-jsx', {"pragma": 'createElement'}]]
                    }
                }
            }
            
        ]
    },

    // 表示开发环境，不用压缩
    mode: "development",
    optimization: {
        minimize: false
    }
}