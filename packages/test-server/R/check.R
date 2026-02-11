
library(DBI)
library(tidyverse)
library(tuneR)
library(retimer)

con <- dbConnect(RSQLite::SQLite(), "packages/test-server/database.db")

df <- tbl(con, "loopback_recordings") |>
    collect() |>
    tail(1)

dbDisconnect(con)

wav <- readWave(sprintf('packages/test-server/data/%s', df$file_path))

specL <- spectrogram(wav@left, wav@samp.rate)
specR <- spectrogram(wav@right, wav@samp.rate)

bind_rows(list(left = specL, right = specR), .id = 'channel') |>
    ggplot() +
    geom_raster(aes(t, f, fill = amp), show.legend = FALSE) +
    scale_fill_viridis_c() +
    facet_grid(cols = vars(channel))
