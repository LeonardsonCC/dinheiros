package config

type Config struct {
    DBPath string `mapstructure:"DB_PATH"`
    Port   string `mapstructure:"PORT"`
}

func LoadConfig() *Config {
    return &Config{
        DBPath: "./dinheiros.db",
        Port:   "8080",
    }
}
