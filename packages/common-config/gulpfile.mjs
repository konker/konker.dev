import gulp from 'gulp';
import packageJson from './package.json' with { type: 'json' };

gulp.task('copy-static', async () =>
  packageJson.staticFiles && packageJson.staticFiles.length > 0
    ? gulp
        .src(packageJson.staticFiles || '', {
          base: '.',
        })
        .pipe(gulp.dest('dist'))
    : undefined
);
