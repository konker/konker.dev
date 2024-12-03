import gulp from 'gulp';
import packageJson from './package.json' assert { type: 'json' };

gulp.task('copy-static', async () =>
  packageJson.staticFiles && packageJson.staticFiles.length > 0
    ? gulp
        .src(packageJson.staticFiles || '', {
          base: 'YOUR_SRC_DIR_COULD_BE_DOT',
        })
        .pipe(gulp.dest('dist'))
    : undefined
);
