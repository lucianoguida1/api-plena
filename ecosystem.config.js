module.exports = {
    apps: [
        {
            name: 'API-Plena (Node)',
            script: './src/app.js',
            instances: 1,
            exec_mode: 'fork',
            autorestart: true,
            watch: false,
            ignore_watch: [
                "node_modules",
                "mydb.sqlite",
                "mydb.sqlite-journal"
            ],
            max_memory_restart: '1G',
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            out_file: './logs/out.log',
            error_file: './logs/error.log',
            combine_logs: true,
        }
    ]
};
