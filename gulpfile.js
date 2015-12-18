var gulp = require('gulp'),
    child = require('child_process');

// Top Level Commands ----------------------------------------------------------

gulp.task('default', ['info']);
gulp.task('lint', ['dolint']);
gulp.task('test', ['dotest']);

// Helper Tasks ----------------------------------------------------------------

gulp.task('info', function() {
  console.log('\nUsage:\t gulp [ lint ]\n');
});

gulp.task('dolint', function(cb) {
  child.spawn('./node_modules/.bin/jscs', ['./'], { stdio: 'inherit' })
       .on('close', cb);
});

gulp.task('test', function(cb) {
  child.spawn('./node_modules/.bin/mocha', [], { stdio: 'inherit' })
       .on('close', cb);
});
